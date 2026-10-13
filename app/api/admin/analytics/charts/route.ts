import { NextResponse } from "next/server";
import { auth, isAdminRole } from "@/lib/auth/config";
import { getOrdersByStatus, getRevenueTimeSeries } from "@/lib/db/queries/analytics";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const requestedDays = Number(new URL(request.url).searchParams.get("days"));
  const days = requestedDays === 30 ? 30 : 14;
  try {
    const [revenue, statuses] = await Promise.all([getRevenueTimeSeries(days), getOrdersByStatus()]);
    return NextResponse.json({ revenue, statuses }, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return NextResponse.json({ error: "Unable to load analytics charts." }, { status: 500 });
  }
}
