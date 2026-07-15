import { parseDocumentFromString } from "@/lib/domParser";
import { postGetPageUrl, PostsMinimumForGetPageUrl } from "../posts/helpers";
import type { McPollAnswer, McPollPublicData } from "./types";

/**
 * Read the multiple-choice payload out of a forum event's `publicData`,
 * tolerating a not-yet-voted event (empty votes) and legacy/empty data.
 */
export function getMcPollPublicData(publicData: unknown): McPollPublicData {
  const data = (publicData ?? {}) as Partial<McPollPublicData>;
  return {
    answers: data.answers ?? [],
    multiSelect: !!data.multiSelect,
    votes: data.votes ?? {},
  };
}

export function getMcPollAnswers(publicData: unknown): McPollAnswer[] {
  return getMcPollPublicData(publicData).answers;
}

/**
 * A forum event is a multiple-choice poll when its `publicData` carries an
 * `answers` array. Both poll formats share eventFormat "POLL", so this presence
 * check (not `eventFormat`) is what distinguishes them.
 */
export function forumEventIsMcPoll(publicData: unknown): boolean {
  const data = (publicData ?? {}) as Partial<McPollPublicData>;
  return Array.isArray(data.answers);
}

/** The given user's selected answer ids, or null if they haven't voted. */
export function getMcPollVoteForUser(
  publicData: unknown,
  userId: string | null | undefined,
): string[] | null {
  if (!userId) return null;
  return getMcPollPublicData(publicData).votes[userId]?.answerIds ?? null;
}

/**
 * Gets a URL to a poll on a post page. The poll will scroll into view when the page loads.
 */
export function getPollUrl(post: PostsMinimumForGetPageUrl, pollId: string, isAbsolute = false): string {
  const baseUrl = postGetPageUrl(post, isAbsolute);
  return `${baseUrl}?pollId=${pollId}`;
}

/**
 * Removes any footnotes and converts what remains to plain text. Only tested against basic html as
 * this is designed for ForumEvent poll questions (which are generally 1 sentence with optional footnotes).
 */
export function stripFootnotes(html: string): string {
  const { document } = parseDocumentFromString(html);

  // Remove every footnote reference
  document.querySelectorAll(".footnote-reference").forEach(ref => ref.remove());

  // Remove the entire .footnotes block (where the list of footnotes usually lives)
  const footnotesBlock = document.querySelector(".footnotes");
  footnotesBlock?.remove();

  return (document.body.textContent || "").trim();
}

export const SCALING_SERIES_ID = "HvynzLsZDJm4vS2gL";
export const BETTER_FUTURES_ID = "wwqGaWf76xgzDaFes";
export const IN_DEVELOPMENT_SERIES_ID = "ryDBPmRxdYbakxsgR";
