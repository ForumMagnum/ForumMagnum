export function truncateAiDigestText(text: string, maxLength: number): string {
  const normalizedText = text.replace(/\s+/g, " ").trim();
  if (normalizedText.length <= maxLength) {
    return normalizedText;
  }

  const initialSlice = normalizedText.slice(0, maxLength - 1);
  const lastCompleteWord = initialSlice.replace(/\s+\S*$/, "");
  return `${lastCompleteWord || initialSlice}…`;
}

export function selectAiDigestExcerpt(
  selectedExcerpt: string | undefined,
  fallbackText: string,
  maxLength: number,
): string {
  return truncateAiDigestText(selectedExcerpt?.trim() || fallbackText, maxLength);
}

export function countAiDigestWords(text: string): number {
  const normalizedText = text.replace(/\s+/g, " ").trim();
  return normalizedText ? normalizedText.split(" ").length : 0;
}

export function formatAiDigestDate(date: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}
