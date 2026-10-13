import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { can } from "@/lib/auth/permissions";
import { getDrizzleClient } from "@/lib/db/drizzle/client";
import { loadDatabaseExport, loadProductsExport, loadProductsPdfExport, makeDatabasePdf, makeExcelXml } from "@/lib/admin/database-export";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user || !can(session.user.role, "analytics:read")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const format = request.nextUrl.searchParams.get("format");
  const dataset = request.nextUrl.searchParams.get("dataset");
  if (format !== "xls" && format !== "pdf") {
    return NextResponse.json({ error: "Choose xls or pdf format." }, { status: 400 });
  }
  try {
    const { pool } = getDrizzleClient();
    const sheets = dataset === "products"
      ? format === "pdf" ? await loadProductsPdfExport(pool) : await loadProductsExport(pool)
      : await loadDatabaseExport(pool);
    const filename = dataset === "products" ? "mini-street-products" : "mini-street-database-export";
    if (format === "xls") {
      return new NextResponse(makeExcelXml(sheets), {
        headers: {
          "Content-Type": "application/vnd.ms-excel; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}.xls"`,
          "Cache-Control": "private, no-store",
        },
      });
    }
    return new NextResponse(new Uint8Array(makeDatabasePdf(sheets)), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}.pdf"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("[GET /api/admin/exports]", error);
    return NextResponse.json({ error: "Could not export database records." }, { status: 500 });
  }
}
