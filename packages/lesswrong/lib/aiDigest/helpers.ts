import { AI_DIGEST_PERSONAL_INSTRUCTIONS_MAX_LENGTH, DAY_MS } from "./constants";

/** UTC midnight (ms since epoch) of the calendar day containing the timestamp. */
function utcDay(timestamp: string | Date): number {
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

/** Whole calendar days from the timestamp's UTC day up to `asOf`'s, never negative. */
export function daysAgo(asOf: Date, timestamp: string | Date): number {
  return Math.max(0, Math.floor((utcDay(asOf) - utcDay(timestamp)) / DAY_MS));
}

/** The reader's instructions trimmed, or null when blank; throws if over the length cap. */
export function validatedAiDigestPersonalInstructions(
  personalInstructions: string | null | undefined,
): string | null {
  const trimmedInstructions = personalInstructions?.trim() || null;
  if (
    trimmedInstructions
    && trimmedInstructions.length > AI_DIGEST_PERSONAL_INSTRUCTIONS_MAX_LENGTH
  ) {
    throw new Error(
      `Personal instructions must contain at most ${AI_DIGEST_PERSONAL_INSTRUCTIONS_MAX_LENGTH} characters`,
    );
  }
  return trimmedInstructions;
}
