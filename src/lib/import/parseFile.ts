import type ExcelJS from "exceljs";
import { parseCsvText } from "./parseCsv";

export interface ParsedSpreadsheet {
  headers: string[];
  rows: Record<string, unknown>[];
}

export async function parseSpreadsheetFile(file: File): Promise<ParsedSpreadsheet> {
  if (file.name.toLowerCase().endsWith(".csv")) {
    const text = await file.text();
    return parseCsvText(text);
  }

  // Carregado sob demanda: a lib é pesada (~1MB) e só é necessária quando
  // alguém realmente importa uma planilha .xlsx, não no carregamento do app.
  const { default: ExcelJSLib } = await import("exceljs");
  const buffer = await file.arrayBuffer();
  const workbook = new ExcelJSLib.Workbook();
  await workbook.xlsx.load(buffer);

  const worksheet = workbook.worksheets.find((ws) => ws.rowCount > 1);
  if (!worksheet) {
    throw new Error("A planilha está vazia ou não foi possível ler nenhuma aba com dados.");
  }

  const headerRow = worksheet.getRow(1);
  const headers: string[] = [];
  headerRow.eachCell({ includeEmpty: false }, (cell) => {
    headers.push(String(cell.value ?? "").trim());
  });

  if (headers.length === 0) {
    throw new Error("Não foi possível identificar o cabeçalho da planilha.");
  }

  const rows: Record<string, unknown>[] = [];
  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) return;
    const values = row.values as (ExcelJS.CellValue | undefined)[];
    const registro: Record<string, unknown> = {};
    headers.forEach((header, index) => {
      // row.values é 1-indexado e o índice 0 fica vazio
      registro[header] = normalizeCellValue(values[index + 1]);
    });
    rows.push(registro);
  });

  if (rows.length === 0) {
    throw new Error("Nenhuma linha de dados foi encontrada na planilha.");
  }

  return { headers, rows };
}

function normalizeCellValue(value: ExcelJS.CellValue | undefined): unknown {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value;
  if (typeof value === "object" && "richText" in value) {
    return value.richText.map((r) => r.text).join("");
  }
  if (typeof value === "object" && "text" in value) {
    return String((value as { text: unknown }).text ?? "");
  }
  if (typeof value === "object" && "result" in value) {
    return (value as { result: unknown }).result ?? "";
  }
  return value;
}
