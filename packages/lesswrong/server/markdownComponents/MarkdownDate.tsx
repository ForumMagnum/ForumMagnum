export function MarkdownDate({date}: { date: Date|string }) {
  const normalizedDate = new Date(date);
  const iso = normalizedDate.toISOString();
  const withoutMilliseconds = iso.replace(/\.\d{3}Z$/, "Z");
  return withoutMilliseconds.replace("T", " ");
}
