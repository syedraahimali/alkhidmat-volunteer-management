import { Card } from "@/components/ui/card";

export default function EventDetailsLoading() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <Card className="h-64 animate-pulse bg-slate-100" aria-label="Loading event details" />
    </main>
  );
}
