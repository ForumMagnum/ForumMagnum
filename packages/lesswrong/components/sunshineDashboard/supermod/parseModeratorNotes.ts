/**
 * Moderator notes (`user.sunshineNotes`) are a single freeform text field which
 * we and moderators have, by convention, written newest-entry-first, with each
 * entry starting with a signature line like `Aug 15, 3:42 PM, Raemon: `
 * (see `getSignatureWithNote`). This parses that text back into entries, so the
 * supermod UI can display the signature separately from the note body.
 *
 * Text before the first recognized signature (or notes written in some older
 * format) becomes a single entry with no timestamp/author.
 */

import moment from 'moment-timezone';

export interface ModeratorNoteEntry {
  /** eg "Aug 15, 3:42 PM"; null for text that had no recognizable signature */
  timestamp: string | null;
  author: string | null;
  body: string;
}

interface ModeratorNoteEntryDraft {
  timestamp: string | null;
  author: string | null;
  bodyLines: string[];
}

// Either "Aug 15" (optionally with a year) or "8/15/2025", optionally followed
// by a time. Old notes were written by hand or by earlier signature formats, so
// this is deliberately looser than what `getSignature` currently produces.
const DATE_PATTERN = String.raw`(?:[A-Z][a-z]{2}\s+\d{1,2}(?:,\s*\d{4})?|\d{1,2}\/\d{1,2}\/\d{2,4})(?:,?\s*\d{1,2}:\d{2}(?::\d{2})?\s*(?:[AP]M)?)?`;
const SIGNATURE_LINE = new RegExp(String.raw`^(${DATE_PATTERN}),\s*([^:\n]{1,60}?)\s*:[ \t]*(.*)$`);

function finishDraft(draft: ModeratorNoteEntryDraft | null): ModeratorNoteEntry | null {
  if (!draft) return null;
  const bodyLines = [...draft.bodyLines];
  while (bodyLines.length && !bodyLines[bodyLines.length - 1].trim()) bodyLines.pop();
  while (bodyLines.length && !bodyLines[0].trim()) bodyLines.shift();
  const body = bodyLines.join('\n');
  if (!body && !draft.author) return null;
  return { timestamp: draft.timestamp, author: draft.author, body };
}

export function parseModeratorNotes(notes: string | null | undefined): ModeratorNoteEntry[] {
  const entries: ModeratorNoteEntry[] = [];
  let draft: ModeratorNoteEntryDraft | null = null;

  for (const line of (notes ?? '').split('\n')) {
    const signature = SIGNATURE_LINE.exec(line);
    if (signature) {
      const finished = finishDraft(draft);
      if (finished) entries.push(finished);
      draft = { timestamp: signature[1], author: signature[2], bodyLines: [signature[3]] };
    } else {
      draft ??= { timestamp: null, author: null, bodyLines: [] };
      draft.bodyLines.push(line);
    }
  }

  const lastEntry = finishDraft(draft);
  if (lastEntry) entries.push(lastEntry);

  return entries;
}

// `getSignature` writes timestamps in Pacific time, and most legacy notes were
// also written by moderators in that timezone, so that's our best guess for how
// to interpret a signature that carries no timezone of its own.
const SIGNATURE_TIMEZONE = 'America/Los_Angeles';

const TIME_FORMATS = ['h:mm A', 'h:mm:ss A', 'H:mm', 'H:mm:ss'];

function withTimes(dateFormats: string[]) {
  return dateFormats.flatMap(date => [
    date,
    ...TIME_FORMATS.flatMap(time => [`${date}, ${time}`, `${date} ${time}`]),
  ]);
}

const DATED_FORMATS = withTimes(['MMM D, YYYY', 'M/D/YYYY', 'M/D/YY']);
const YEARLESS_FORMATS = withTimes(['MMM D']);

/**
 * Turn a signature timestamp (see `ModeratorNoteEntry.timestamp`) into a Date,
 * or null if it isn't in a format we recognize. Most signatures omit the year,
 * in which case we assume the note is the most recent one that could have been
 * written that way, since notes are always about the past.
 */
export function parseModeratorNoteTimestamp(timestamp: string | null, now: Date): Date | null {
  if (!timestamp) return null;

  const dated = moment.tz(timestamp, DATED_FORMATS, true, SIGNATURE_TIMEZONE);
  if (dated.isValid()) return dated.toDate();

  const yearless = moment.tz(timestamp, YEARLESS_FORMATS, true, SIGNATURE_TIMEZONE);
  if (!yearless.isValid()) return null;
  yearless.year(moment.tz(now, SIGNATURE_TIMEZONE).year());
  if (yearless.toDate().getTime() > now.getTime() + 24 * 60 * 60 * 1000) {
    yearless.subtract(1, 'year');
  }
  return yearless.toDate();
}
