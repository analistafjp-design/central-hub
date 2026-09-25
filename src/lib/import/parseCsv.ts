/** Parser simples de CSV (RFC 4180: campos entre aspas, aspas escapadas como ""). */
export function parseCsvText(text: string): { headers: string[]; rows: Record<string, unknown>[] } {
  const linhas = splitCsvLines(text);
  if (linhas.length === 0) {
    throw new Error("Nenhuma linha de dados foi encontrada no CSV.");
  }

  const headers = linhas[0];
  const rows = linhas.slice(1).map((valores) => {
    const row: Record<string, unknown> = {};
    headers.forEach((header, i) => {
      row[header] = valores[i] ?? "";
    });
    return row;
  });

  return { headers, rows };
}

function splitCsvLines(text: string): string[][] {
  const delimitador = text.includes(";") && !text.includes(",") ? ";" : ",";
  const linhas: string[][] = [];
  let campo = "";
  let linha: string[] = [];
  let dentroDeAspas = false;

  const normalizado = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  for (let i = 0; i < normalizado.length; i++) {
    const char = normalizado[i];

    if (dentroDeAspas) {
      if (char === '"') {
        if (normalizado[i + 1] === '"') {
          campo += '"';
          i++;
        } else {
          dentroDeAspas = false;
        }
      } else {
        campo += char;
      }
      continue;
    }

    if (char === '"') {
      dentroDeAspas = true;
    } else if (char === delimitador) {
      linha.push(campo.trim());
      campo = "";
    } else if (char === "\n") {
      linha.push(campo.trim());
      if (linha.some((v) => v !== "")) linhas.push(linha);
      linha = [];
      campo = "";
    } else {
      campo += char;
    }
  }

  if (campo !== "" || linha.length > 0) {
    linha.push(campo.trim());
    if (linha.some((v) => v !== "")) linhas.push(linha);
  }

  return linhas;
}
