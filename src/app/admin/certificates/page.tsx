import { CertificateForm } from "@/components/community/certificate-form";
import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminCertificatesPage() {
  const { user } = await requireAdmin();
  const supabase = await createClient();
  const { data: attendance } = await supabase.from("attendance").select("id, volunteer_id, event_id, check_in, check_out, status, check_in_method").in("status", ["present", "late"]).order("check_in", { ascending: false }).limit(50);
  const records = attendance ?? [];
  const volunteerIds = records.map((item) => item.volunteer_id).filter((id): id is string => Boolean(id));
  const eventIds = records.map((item) => item.event_id).filter((id): id is string => Boolean(id));
  const [{ data: volunteers }, { data: events }, { data: certificates }] = await Promise.all([
    volunteerIds.length ? supabase.from("volunteers").select("id, full_name").in("id", volunteerIds) : Promise.resolve({ data: [] }),
    eventIds.length ? supabase.from("events").select("id, event_name").in("id", eventIds) : Promise.resolve({ data: [] }),
    supabase.from("certificates").select("id, certificate_id, volunteer_name, event_name, hours, issued_at").order("issued_at", { ascending: false }).limit(30),
  ]);
  const names = new Map((volunteers ?? []).map((item) => [item.id, item.full_name]));
  const eventsById = new Map((events ?? []).map((item) => [item.id, item.event_name]));
  return <AppShell userEmail={user.email} isAdmin><div className="grid gap-6"><div><p className="text-sm font-medium text-brand">Recognition</p><h1 className="mt-2 text-3xl font-semibold text-slate-950">Automatic certificates</h1><p className="mt-2 text-sm text-slate-600">Generate certificates from verified present or late attendance. Duplicate certificates are prevented.</p></div><Card className="p-5"><h2 className="text-lg font-semibold text-slate-950">Eligible attendance</h2><div className="mt-4 grid gap-3">{records.length ? records.map((record) => <div key={record.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-slate-200 p-3"><div><p className="font-medium text-slate-950">{names.get(record.volunteer_id || "") || "Volunteer"}</p><p className="text-sm text-slate-600">{eventsById.get(record.event_id || "") || "Event"} · {record.check_in_method || "attendance"}</p></div><CertificateForm attendanceId={record.id} /></div>) : <p className="text-sm text-slate-600">No eligible attendance records yet.</p>}</div></Card><Card className="p-5"><h2 className="text-lg font-semibold text-slate-950">Issued certificates</h2><div className="mt-4 grid gap-3">{certificates?.length ? certificates.map((certificate) => <div key={certificate.id} className="rounded-md border border-slate-200 p-3"><p className="font-medium text-slate-950">{certificate.certificate_id}</p><p className="text-sm text-slate-600">{certificate.volunteer_name} · {certificate.event_name} · {certificate.hours} hours</p></div>) : <p className="text-sm text-slate-600">No certificates issued yet.</p>}</div></Card></div></AppShell>;
}
