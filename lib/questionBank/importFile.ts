import { parseCsv } from './importParser';

export type FileContent = { kind: 'text'; text: string } | { kind: 'table'; rows: string[][] };

/** Yuklangan fayl mazmunini matn (DOCX/PDF/TXT) yoki jadval (CSV/XLSX) ko'rinishida qaytaradi. */
export async function readImportFile(name: string, buffer: Buffer): Promise<FileContent> {
    const lower = name.toLowerCase();

    if (lower.endsWith('.txt')) return { kind: 'text', text: buffer.toString('utf8') };
    if (lower.endsWith('.docx')) {
        const mammoth = await import('mammoth');
        return { kind: 'text', text: (await mammoth.extractRawText({ buffer })).value };
    }
    if (lower.endsWith('.pdf')) {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const pdfParse = require('pdf-parse') as (buf: Buffer) => Promise<{ text: string }>;
        return { kind: 'text', text: (await pdfParse(buffer)).text };
    }
    if (lower.endsWith('.csv')) return { kind: 'table', rows: parseCsv(buffer.toString('utf8')) };
    if (lower.endsWith('.xlsx')) {
        const ExcelJS = (await import('exceljs')).default;
        const wb = new ExcelJS.Workbook();
        await wb.xlsx.load(buffer as any);
        const sheet = wb.worksheets[0];
        if (!sheet) return { kind: 'table', rows: [] };
        const rows: string[][] = [];
        sheet.eachRow({ includeEmpty: false }, row => {
            const cells: string[] = [];
            for (let c = 1; c <= sheet.columnCount; c++) cells.push(row.getCell(c).text ?? '');
            rows.push(cells);
        });
        return { kind: 'table', rows };
    }
    throw new Error("Qo'llab-quvvatlanadigan formatlar: DOCX, PDF, TXT, CSV, XLSX");
}
