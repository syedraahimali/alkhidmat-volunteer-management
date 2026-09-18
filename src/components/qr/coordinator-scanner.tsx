"use client";

import { useEffect, useState, useTransition } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { CheckCircle2, Loader2, WifiOff } from "lucide-react";
import { recordAttendanceScanAction } from "@/lib/qr/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type EventOption = {
  id: string;
  event_name: string | null;
  status: string | null;
};

type PendingScan = {
  id: string;
  eventId: string;
  token: string;
  queuedAt: string;
};

const queueKey = "volunteer-attendance-pending-scans";

function readPendingQueue(): PendingScan[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const stored = window.localStorage.getItem(queueKey);
    return stored ? (JSON.parse(stored) as PendingScan[]) : [];
  } catch {
    return [];
  }
}

function CameraScanner({ onDecoded }: { onDecoded: (token: string) => void }) {
  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "volunteer-qr-reader",
      { fps: 10, qrbox: { width: 240, height: 240 }, rememberLastUsedCamera: true },
      false,
    );
    scanner.render(onDecoded, () => undefined);

    return () => {
      scanner.clear().catch(() => undefined);
    };
  }, [onDecoded]);

  return <div id="volunteer-qr-reader" className="overflow-hidden rounded-md" aria-label="QR camera scanner" />;
}

export function CoordinatorScanner({ events }: { events: EventOption[] }) {
  const [selectedEventId, setSelectedEventId] = useState(events[0]?.id ?? "");
  const [manualToken, setManualToken] = useState("");
  const [pendingCount, setPendingCount] = useState(() => readPendingQueue().length);
  const [message, setMessage] = useState<string | null>(null);
  const [messageIsSuccess, setMessageIsSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  function writeQueue(queue: PendingScan[]) {
    window.localStorage.setItem(queueKey, JSON.stringify(queue));
    setPendingCount(queue.length);
  }

  function queueScan(token: string) {
    const queue = readPendingQueue();
    queue.push({
      id: crypto.randomUUID(),
      eventId: selectedEventId,
      token,
      queuedAt: new Date().toISOString(),
    });
    writeQueue(queue);
    setMessage("Network unavailable. Scan saved locally and has not been recorded yet.");
    setMessageIsSuccess(false);
  }

  function submitToken(token: string) {
    const normalizedToken = token.trim();
    if (!normalizedToken || !selectedEventId) {
      setMessage("Select an event and scan a volunteer QR first.");
      setMessageIsSuccess(false);
      return;
    }
    if (!navigator.onLine) {
      queueScan(normalizedToken);
      return;
    }

    startTransition(async () => {
      const result = await recordAttendanceScanAction({ eventId: selectedEventId, token: normalizedToken });
      setMessage(result.message ?? "Scan processed.");
      setMessageIsSuccess(Boolean(result.ok));
      setManualToken("");
    });
  }

  useEffect(() => {
    async function syncPendingScans() {
      if (!navigator.onLine) {
        return;
      }

      const queue = readPendingQueue();
      if (!queue.length) {
        return;
      }

      const remaining: PendingScan[] = [];
      for (const scan of queue) {
        const result = await recordAttendanceScanAction({
          eventId: scan.eventId,
          token: scan.token,
          offlineSyncId: scan.id,
        });
        if (!result.ok && !result.message?.includes("already checked in")) {
          remaining.push(scan);
        }
      }
      writeQueue(remaining);
      setMessage(remaining.length ? "Some offline scans remain queued for retry." : "Offline scans synced successfully.");
      setMessageIsSuccess(remaining.length === 0);
    }

    window.addEventListener("online", syncPendingScans);
    void syncPendingScans();
    return () => window.removeEventListener("online", syncPendingScans);
  }, []);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <Card className="p-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Live scanner</p>
            <h2 className="mt-2 text-xl font-semibold text-slate-950">Scan volunteer QR</h2>
          </div>
          {pendingCount ? (
            <span className="inline-flex items-center gap-2 text-sm text-amber-700">
              <WifiOff className="h-4 w-4" />
              {pendingCount} queued
            </span>
          ) : null}
        </div>
        <div className="mt-5">
          <Label htmlFor="attendance-event">Event</Label>
          <select
            id="attendance-event"
            value={selectedEventId}
            onChange={(event) => setSelectedEventId(event.target.value)}
            className="mt-2 h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 focus:border-brand focus:outline-none focus:ring-2 focus:ring-teal-100"
          >
            <option value="">Select an event</option>
            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.event_name || "Untitled event"} ({event.status})
              </option>
            ))}
          </select>
        </div>
        <div className="mt-5 rounded-md border border-slate-200 bg-slate-50 p-3">
          <CameraScanner onDecoded={submitToken} />
        </div>
        <p className="mt-3 text-xs leading-5 text-slate-500">Camera scanning stays in this browser. Only the opaque QR value is sent to the protected server action.</p>
      </Card>

      <Card className="p-5">
        <h2 className="text-lg font-semibold text-slate-950">Manual fallback</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">Use this when a camera is unavailable. The QR value is never displayed after submission.</p>
        <form
          className="mt-5 grid gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            submitToken(manualToken);
          }}
        >
          <Label htmlFor="manual-qr-value">Opaque QR value</Label>
          <Input
            id="manual-qr-value"
            value={manualToken}
            onChange={(event) => setManualToken(event.target.value)}
            autoComplete="off"
            spellCheck={false}
          />
          <Button type="submit" disabled={isPending || !selectedEventId}>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            {isPending ? "Checking" : "Check in volunteer"}
          </Button>
        </form>
        {message ? <p className={messageIsSuccess ? "mt-4 text-sm text-brand" : "mt-4 text-sm text-red-700"}>{message}</p> : null}
      </Card>
    </div>
  );
}
