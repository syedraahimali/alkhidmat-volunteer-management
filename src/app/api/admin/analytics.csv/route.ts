import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  await requireAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase.from("volunteer_impact_summary").select("volunteer_id, events_registered, events_attended, total_minutes, total_hours, certificates_earned, badges_earned").limit(5000);
  if (error) return NextResponse.json({ error: "Could not export analytics." }, { status: 500 });
  const headers = ["volunteer_id", "events_registered", "events_attended", "total_minutes", "total_hours", "certificates_earned", "badges_earned"];
  const escape = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;
  const csv = [headers.join(","), ...(data ?? []).map((row) => headers.map((header) => escape(row[header as keyof typeof row])).join(","))].join("\n");
  return new NextResponse(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": "attachment; filename=volunteer-impact.csv", "Cache-Control": "no-store" } });
}
