"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { generateCertificateAction, type CommunityActionState } from "@/lib/community/actions";
import { Button } from "@/components/ui/button";

const initialState: CommunityActionState = {};

export function CertificateForm({ attendanceId }: { attendanceId: string }) {
  const [state, action, pending] = useActionState(generateCertificateAction, initialState);
  return <form action={action} className="inline-flex items-center gap-2"><input type="hidden" name="attendanceId" value={attendanceId} /><Button type="submit" variant="outline" size="sm" disabled={pending}>{pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}{pending ? "Generating" : "Generate certificate"}</Button>{state.message ? <span className={state.ok ? "text-xs text-brand" : "text-xs text-red-700"}>{state.message}</span> : null}</form>;
}
