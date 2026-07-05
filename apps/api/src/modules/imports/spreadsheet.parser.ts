import { parse } from 'csv-parse/sync';
import { Workbook } from 'exceljs';

export interface ClientRow {
  cnpj?: string;
  razaoSocial?: string;
  nomeFantasia?: string;
  email?: string;
  telefone?: string;
  cep?: string;
  cidade?: string;
  uf?: string;
}

const HEADER_MAP: Record<string, keyof ClientRow> = {
  cnpj: 'cnpj',
  razaosocial: 'razaoSocial',
  razao: 'razaoSocial',
  nomefantasia: 'nomeFantasia',
  fantasia: 'nomeFantasia',
  email: 'email',
  telefone: 'telefone',
  cep: 'cep',
  cidade: 'cidade',
  municipio: 'cidade',
  uf: 'uf',
};

function normalizeKey(key: string): string {
  return key
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z]/g, '');
}

function mapRow(raw: Record<string, unknown>): ClientRow {
  const row: ClientRow = {};
  for (const [k, v] of Object.entries(raw)) {
    const campo = HEADER_MAP[normalizeKey(k)];
    if (campo && v != null && String(v).trim() !== '') {
      row[campo] = String(v).trim();
    }
  }
  return row;
}

/** Converte uma planilha CSV ou XLSX (buffer) em linhas de cliente. */
export async function parseSpreadsheet(
  buffer: Buffer,
  filename: string,
): Promise<ClientRow[]> {
  const ext = filename.toLowerCase().split('.').pop();

  if (ext === 'csv') {
    const registros = parse(buffer, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      bom: true,
    }) as Record<string, unknown>[];
    return registros.map(mapRow);
  }

  const wb = new Workbook();
  await wb.xlsx.load(buffer as unknown as ArrayBuffer);
  const ws = wb.worksheets[0];
  if (!ws) return [];

  const headers: string[] = [];
  const linhas: ClientRow[] = [];
  ws.eachRow((row, rowNumber) => {
    const values = row.values as unknown[]; // índice 1-based
    if (rowNumber === 1) {
      values.forEach((v, i) => {
        if (i > 0) headers[i] = String(v ?? '');
      });
      return;
    }
    const obj: Record<string, unknown> = {};
    values.forEach((v, i) => {
      if (i > 0 && headers[i]) obj[headers[i]] = v;
    });
    linhas.push(mapRow(obj));
  });
  return linhas;
}
