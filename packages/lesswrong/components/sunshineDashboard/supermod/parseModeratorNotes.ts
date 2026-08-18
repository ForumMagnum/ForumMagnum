/**
 * `user.sunshineNotes` is one freeform text field that every writer prepends to, so it
 * reads newest-first, each entry opening with a signature like `Aug 15, 3:42 PM, Raemon:`
 * (see `getSignatureWithNote`). This parses it back into entries for the supermod UI.
 * Text before the first recognized signature becomes one entry with no timestamp/author.
 */

import moment from '@/lib/moment-timezone';

export interface ModeratorNoteEntry {
  /** eg "Aug 15, 3:42 PM"; null for text that had no recognizable signature */
  timestamp: string | null;
  /** null if `timestamp` wasn't in a format we recognize */
  date: Date | null;
  author: string | null;
  body: string;
}

interface ModeratorNoteEntryDraft {
  timestamp: string | null;
  author: string | null;
  bodyLines: string[];
}

// Looser than what `getSignature` writes, since older notes were signed by hand or
// by earlier formats. Validity is left to the strict moment parse in `resolveTimestamp`.
const DATE_PATTERN = String.raw`(?:[A-Z][a-z]{2}\s+\d{1,2}(?:,\s*\d{4})?|\d{1,2}\/\d{1,2}\/\d{2,4})(?:,?\s*\d{1,2}:\d{2}(?::\d{2})?\s*(?:[AP]M)?)?`;
// The author cap is arbitrary; it stops a prose line opening with a date matching here.
const SIGNATURE_LINE = new RegExp(String.raw`^(${DATE_PATTERN}),\s*([^:\n]{1,60}?)\s*:[ \t]*(.*)$`);

// Signatures carry no timezone of their own; `getSignature` stamps them in Pacific.
const SIGNATURE_TIMEZONE = 'America/Los_Angeles';

const TIME_FORMATS = ['h:mm A', 'h:mm:ss A', 'H:mm', 'H:mm:ss'];

// Commas are stripped before parsing, so formats needn't cover every punctuation variant.
function withTimes(dateFormats: string[]) {
  return dateFormats.flatMap(date => [date, ...TIME_FORMATS.map(time => `${date} ${time}`)]);
}

const DATED_FORMATS = withTimes(['MMM D YYYY', 'M/D/YYYY', 'M/D/YY']);
const YEARLESS_FORMATS = withTimes(['MMM D']);

function finishDraft(draft: ModeratorNoteEntryDraft | null): Omit<ModeratorNoteEntry, 'date'> | null {
  if (!draft) return null;
  const bodyLines = [...draft.bodyLines];
  while (bodyLines.length && !bodyLines[bodyLines.length - 1].trim()) bodyLines.pop();
  while (bodyLines.length && !bodyLines[0].trim()) bodyLines.shift();
  const body = bodyLines.join('\n');
  if (!body && !draft.author) return null;
  return { timestamp: draft.timestamp, author: draft.author, body };
}

/**
 * `getSignature` omits the year, so it has to be inferred: entries are newest-first, so
 * an entry is no newer than the one above it. Pick the latest year that respects that.
 */
function resolveTimestamp(timestamp: string | null, noLaterThan: Date): Date | null {
  if (!timestamp) return null;
  const normalized = timestamp.replace(/,/g, ' ').replace(/\s+/g, ' ').trim();

  const dated = moment.tz(normalized, DATED_FORMATS, true, SIGNATURE_TIMEZONE);
  if (dated.isValid()) return dated.toDate();

  const yearless = moment.tz(normalized, YEARLESS_FORMATS, true, SIGNATURE_TIMEZONE);
  if (!yearless.isValid()) return null;

  yearless.year(moment.tz(noLaterThan, SIGNATURE_TIMEZONE).year());
  if (yearless.toDate().getTime() > noLaterThan.getTime()) {
    yearless.subtract(1, 'year');
  }
  return yearless.toDate();
}

export function parseModeratorNotes(notes: string | null | undefined, now: Date): ModeratorNoteEntry[] {
  const parsedEntries: Array<Omit<ModeratorNoteEntry, 'date'>> = [];
  let draft: ModeratorNoteEntryDraft | null = null;

  for (const line of (notes ?? '').split('\n')) {
    const signature = SIGNATURE_LINE.exec(line);
    if (signature) {
      const finished = finishDraft(draft);
      if (finished) parsedEntries.push(finished);
      draft = { timestamp: signature[1], author: signature[2], bodyLines: [signature[3]] };
    } else {
      draft ??= { timestamp: null, author: null, bodyLines: [] };
      draft.bodyLines.push(line);
    }
  }

  const lastEntry = finishDraft(draft);
  if (lastEntry) parsedEntries.push(lastEntry);

  // Generous slack for clock skew: this bounds only the newest entry, and guessing it
  // too tight dates the note a whole year early.
  let noLaterThan = new Date(now.getTime() + (24 * 60 * 60 * 1000));
  return parsedEntries.map(entry => {
    const date = resolveTimestamp(entry.timestamp, noLaterThan);
    if (date) noLaterThan = date;
    return { ...entry, date };
  });
}
