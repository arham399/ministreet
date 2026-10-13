import type { Pool } from "pg";

const APPLICATION_TABLES = [
  "Address", "AuditLog", "Category", "ContactMessage", "Coupon", "CustomerNote",
  "Discount", "DiscountProduct", "EmailLog", "Faq", "InventoryMovement", "Invoice",
  "NewsletterSubscriber", "Offer", "Order", "OrderItem", "OrderStatusHistory",
  "Product", "ProductImage", "ProductTag", "Review", "SiteSetting", "TrackingEvent",
  "Wishlist", "WishlistItem", "_CategoryToDiscount",
] as const;

export type ExportSheet = { name: string; columns: string[]; rows: unknown[][] };

export async function loadDatabaseExport(pool: Pool): Promise<ExportSheet[]> {
  const sheets: ExportSheet[] = [];
  for (const table of APPLICATION_TABLES) {
    // Table names are selected from the fixed allowlist above.
    const result = await pool.query(`SELECT * FROM public."${table}"`);
    let fields = result.fields.map((field) => field.name);
    let rows = result.rows as Record<string, unknown>[];
    if (table === "Order") {
      fields = fields.filter((field) => field !== "paymentProofPath");
      rows = rows.map(({ paymentProofPath: _privateProofPath, ...row }) => row);
    }
    sheets.push({ name: table.slice(0, 31), columns: fields, rows: rows.map((row) => fields.map((field) => row[field])) });
  }
  const users = await pool.query('SELECT "id", "email", "name", "role", "isActive", "createdAt", "updatedAt" FROM public."User" ORDER BY "createdAt"');
  sheets.push({
    name: "User",
    columns: users.fields.map((field) => field.name),
    rows: users.rows.map((row: Record<string, unknown>) => users.fields.map((field) => row[field.name])),
  });
  return sheets;
}

export async function loadProductsExport(pool: Pool): Promise<ExportSheet[]> {
  const result = await pool.query(`
    SELECT p.*, COALESCE((
      SELECT json_agg(i."url" ORDER BY i."sortOrder")
      FROM public."ProductImage" i WHERE i."productId" = p."id"
    ), '[]'::json) AS "imageUrls"
    FROM public."Product" p
    ORDER BY p."createdAt" DESC
  `);
  return [{
    name: "Products",
    columns: result.fields.map((field) => field.name),
    rows: result.rows.map((row: Record<string, unknown>) => result.fields.map((field) => row[field.name])),
  }];
}

export async function loadProductsPdfExport(pool: Pool): Promise<ExportSheet[]> {
  const result = await pool.query(`
    SELECT
      p."name" AS "Product",
      p."sku" AS "SKU",
      COALESCE(c."name", '') AS "Category",
      COALESCE(p."description", '') AS "Description",
      p."price" AS "Price (Rs.)",
      p."salePrice" AS "Sale Price (Rs.)",
      p."stockQuantity" AS "Stock",
      CASE
        WHEN p."archivedAt" IS NOT NULL THEN 'Archived'
        WHEN p."isActive" THEN 'Active'
        ELSE 'Inactive'
      END AS "Status",
      p."createdAt" AS "Added On"
    FROM public."Product" p
    LEFT JOIN public."Category" c ON c."id" = p."categoryId"
    ORDER BY p."createdAt" DESC
  `);
  return [{
    name: "Products",
    columns: result.fields.map((field) => field.name),
    rows: result.rows.map((row: Record<string, unknown>) => result.fields.map((field) => row[field.name])),
  }];
}

function cellText(value: unknown) {
  if (value == null) return "";
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object") return JSON.stringify(value);
  const text = String(value);
  // PostgreSQL NUMERIC values arrive from `pg` as strings. Strip insignificant
  // fractional zeroes so exports show currency as 5000 or 5000.25, not a
  // database-scale value such as 5000.000000000000000000000000000000.
  if (/^-?\d+\.\d+$/.test(text)) return text.replace(/0+$/, "").replace(/\.$/, "");
  return text;
}

function xmlEscape(value: unknown) {
  return cellText(value)
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

export function makeExcelXml(sheets: ExportSheet[]) {
  const worksheets = sheets.map((sheet) => {
    const rows = [sheet.columns, ...sheet.rows].map((row) => `<Row>${row.map((value) => `<Cell><Data ss:Type="String">${xmlEscape(value)}</Data></Cell>`).join("")}</Row>`).join("");
    return `<Worksheet ss:Name="${xmlEscape(sheet.name)}"><Table>${rows}</Table></Worksheet>`;
  }).join("");
  return `<?xml version="1.0"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">${worksheets}</Workbook>`;
}

function pdfEscape(value: string) {
  return value.replace(/[^\x20-\x7E]/g, "?").replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

export function makeDatabasePdf(sheets: ExportSheet[]) {
  const generatedAt = new Date().toISOString();
  const isProductReport = sheets.length === 1 && sheets[0]?.name === "Products";
  const documentTitle = isProductReport ? "MINI STREET | PRODUCT REPORT" : "MINI STREET | DATABASE EXPORT";
  const pages: string[][] = [];
  let page: string[] = [];
  let y = 0;
  const startPage = () => {
    page = [
      `BT /F2 14 Tf 42 566 Td (${pdfEscape(documentTitle)}) Tj ET`,
      `BT /F1 8 Tf 42 550 Td (${pdfEscape(isProductReport ? `Generated ${generatedAt}  |  Product catalog and stock overview` : `Generated ${generatedAt}  |  Sensitive authentication secrets and payment proof paths excluded`)}) Tj ET`,
      "0.82 G 42 540 m 800 540 l S 0 G",
    ];
    pages.push(page);
    y = 524;
  };
  const addText = (text: string, x: number, size = 8, font = "F1", leading = 10) => {
    page.push(`BT /${font} ${size} Tf ${x} ${y} Td (${pdfEscape(text)}) Tj ET`);
    y -= leading;
  };
  const addRule = () => {
    page.push(`0.88 G 42 ${y + 3} m 800 ${y + 3} l S 0 G`);
  };
  const wrap = (text: string, width: number) => {
    const words = text.split(/\s+/).filter(Boolean);
    const lines: string[] = [];
    let current = "";
    for (const word of words) {
      if (word.length > width) {
        if (current) { lines.push(current); current = ""; }
        for (let offset = 0; offset < word.length; offset += width) lines.push(word.slice(offset, offset + width));
      } else if (!current) current = word;
      else if (`${current} ${word}`.length <= width) current += ` ${word}`;
      else { lines.push(current); current = word; }
    }
    if (current) lines.push(current);
    return lines.length ? lines : [""];
  };
  startPage();

  for (const sheet of sheets) {
    if (y < 70) startPage();
    addText(sheet.name.toUpperCase(), 42, 12, "F2", 15);
    addText(`${sheet.rows.length} ${sheet.rows.length === 1 ? "record" : "records"}`, 42, 8, "F1", 12);
    addRule();
    y -= 7;
    if (sheet.rows.length === 0) {
      addText("No records in this section.", 42, 8, "F1", 14);
      y -= 8;
      continue;
    }

    sheet.rows.forEach((row, index) => {
      const headingIndex = sheet.columns.findIndex((column) => /^(name|title|product|orderNumber|invoiceNumber|code|email|sku)$/i.test(column));
      const heading = headingIndex >= 0 && row[headingIndex] != null ? cellText(row[headingIndex]) : `Record ${index + 1}`;
      if (y < 68) startPage();
      addText(`${sheet.name}  |  Record ${index + 1}  |  ${heading}`, 42, 9, "F2", 12);

      const fields = sheet.columns.map((column, fieldIndex) => {
        const label = column.replace(/([a-z0-9])([A-Z])/g, "$1 $2");
        const value = cellText(row[fieldIndex]);
        return wrap(`${label}: ${value || "—"}`, 78);
      });
      const midpoint = Math.ceil(fields.length / 2);
      const left = fields.slice(0, midpoint).flatMap((lines) => [...lines, ""]);
      const right = fields.slice(midpoint).flatMap((lines) => [...lines, ""]);
      const lineCount = Math.max(left.length, right.length);
      for (let lineIndex = 0; lineIndex < lineCount; lineIndex++) {
        if (y < 38) {
          startPage();
          addText(`${sheet.name} · Record ${index + 1} (continued)`, 42, 9, "F2", 12);
        }
        const baseline = y;
        if (left[lineIndex]) page.push(`BT /F1 7.5 Tf 48 ${baseline} Td (${pdfEscape(left[lineIndex])}) Tj ET`);
        if (right[lineIndex]) page.push(`BT /F1 7.5 Tf 430 ${baseline} Td (${pdfEscape(right[lineIndex])}) Tj ET`);
        y -= 9;
      }
      y -= 4;
      addRule();
      y -= 9;
    });
    y -= 4;
  }

  pages.forEach((commands, index) => {
    commands.push(`BT /F1 8 Tf 770 18 Td (${pdfEscape(`Page ${index + 1} of ${pages.length}`)}) Tj ET`);
  });
  const objects: string[] = [];
  const pageRefs = pages.map((_, index) => `${3 + index * 2} 0 R`).join(" ");
  objects.push("<< /Type /Catalog /Pages 2 0 R >>");
  objects.push(`<< /Type /Pages /Kids [${pageRefs}] /Count ${pages.length} >>`);
  pages.forEach((page, index) => {
    const pageObj = 3 + index * 2;
    const streamObj = pageObj + 1;
    const stream = page.join("\n");
    const fontObject = 3 + pages.length * 2;
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 842 595] /Contents ${streamObj} 0 R /Resources << /Font << /F1 ${fontObject} 0 R /F2 ${fontObject + 1} 0 R >> >> >>`);
    objects.push(`<< /Length ${Buffer.byteLength(stream, "ascii")} >>\nstream\n${stream}\nendstream`);
  });
  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>");
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => { offsets.push(Buffer.byteLength(pdf, "ascii")); pdf += `${index + 1} 0 obj\n${object}\nendobj\n`; });
  const xref = Buffer.byteLength(pdf, "ascii");
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => { pdf += `${String(offset).padStart(10, "0")} 00000 n \n`; });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(pdf, "ascii");
}
