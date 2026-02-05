export function MarkdownDate({date}: { date: Date|string }) {
  const normalizedDate = new Date(date);
  return normalizedDate.toISOString();
}
