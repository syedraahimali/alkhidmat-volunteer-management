export function formatEventDateTime(value: string | null) {
  if (!value) {
    return "Time to be announced";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function formatRegistrationWindow(opensAt: string | null, closesAt: string | null) {
  if (!opensAt && !closesAt) {
    return "Registration window set by coordinator";
  }

  const start = opensAt ? formatEventDateTime(opensAt) : "Now";
  const end = closesAt ? formatEventDateTime(closesAt) : "Until filled";
  return `${start} to ${end}`;
}
