import { Card } from "@/components/ui/card";

export default function EventsLoading() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <Card className="h-32 animate-pulse bg-slate-100" aria-label="Loading events" />
    </main>
  );
}
