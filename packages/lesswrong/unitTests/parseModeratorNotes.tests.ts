import moment from 'moment-timezone';
import { parseModeratorNotes, parseModeratorNoteTimestamp } from '@/components/sunshineDashboard/supermod/parseModeratorNotes';

describe('parseModeratorNotes', () => {
  it('returns no entries for empty notes', () => {
    expect(parseModeratorNotes('')).toEqual([]);
    expect(parseModeratorNotes(null)).toEqual([]);
  });

  it('parses a signed entry', () => {
    expect(parseModeratorNotes('Aug 15, 3:42 PM, Raemon: snoozed\n')).toEqual([
      { timestamp: 'Aug 15, 3:42 PM', author: 'Raemon', body: 'snoozed' },
    ]);
  });

  it('parses multiple entries, newest first', () => {
    const notes = 'Aug 15, 3:42 PM, Raemon: snoozed\nAug 14, 1:00 PM, habryka: reviewed\n';
    expect(parseModeratorNotes(notes)).toEqual([
      { timestamp: 'Aug 15, 3:42 PM', author: 'Raemon', body: 'snoozed' },
      { timestamp: 'Aug 14, 1:00 PM', author: 'habryka', body: 'reviewed' },
    ]);
  });

  it('keeps continuation lines with their entry', () => {
    const notes = 'Aug 15, 3:42 PM, Raemon: first line\nsecond line\n\nAug 14, 1:00 PM, habryka: older';
    expect(parseModeratorNotes(notes)).toEqual([
      { timestamp: 'Aug 15, 3:42 PM', author: 'Raemon', body: 'first line\nsecond line' },
      { timestamp: 'Aug 14, 1:00 PM', author: 'habryka', body: 'older' },
    ]);
  });

  it('handles unsigned leading text', () => {
    const notes = 'some old unsigned note\nAug 14, 1:00 PM, habryka: signed';
    expect(parseModeratorNotes(notes)).toEqual([
      { timestamp: null, author: null, body: 'some old unsigned note' },
      { timestamp: 'Aug 14, 1:00 PM', author: 'habryka', body: 'signed' },
    ]);
  });

  it('handles legacy signature formats', () => {
    expect(parseModeratorNotes('10/25/2019, Ruby: old style')).toEqual([
      { timestamp: '10/25/2019', author: 'Ruby', body: 'old style' },
    ]);
    expect(parseModeratorNotes('Aug 15, 2024, Raemon: with a year')).toEqual([
      { timestamp: 'Aug 15, 2024', author: 'Raemon', body: 'with a year' },
    ]);
  });

  it('strips the extra indentation automod notes carry after the colon', () => {
    expect(parseModeratorNotes('Aug 13, 2:13 AM, Arjun Rao:  "Unreviewed post"')).toEqual([
      { timestamp: 'Aug 13, 2:13 AM', author: 'Arjun Rao', body: '"Unreviewed post"' },
    ]);
  });

  it('does not treat a colon in prose as a signature', () => {
    expect(parseModeratorNotes('Aug 15, 3:42 PM, Raemon: note\nsee this: a thing')).toEqual([
      { timestamp: 'Aug 15, 3:42 PM', author: 'Raemon', body: 'note\nsee this: a thing' },
    ]);
  });
});

describe('parseModeratorNoteTimestamp', () => {
  const pacific = (str: string) => moment.tz(str, 'YYYY-MM-DD h:mm A', 'America/Los_Angeles').toDate();
  const now = pacific('2025-08-20 12:00 PM');

  it('parses a current-format signature as Pacific time', () => {
    expect(parseModeratorNoteTimestamp('Aug 15, 3:42 PM', now)).toEqual(pacific('2025-08-15 3:42 PM'));
  });

  it('parses legacy formats', () => {
    expect(parseModeratorNoteTimestamp('10/25/2019', now)).toEqual(pacific('2019-10-25 12:00 AM'));
    expect(parseModeratorNoteTimestamp('Aug 15, 2024', now)).toEqual(pacific('2024-08-15 12:00 AM'));
  });

  it('assumes last year when a yearless date would otherwise be in the future', () => {
    expect(parseModeratorNoteTimestamp('Dec 3, 1:00 PM', now)).toEqual(pacific('2024-12-03 1:00 PM'));
  });

  it('returns null for missing or unrecognized timestamps', () => {
    expect(parseModeratorNoteTimestamp(null, now)).toBe(null);
    expect(parseModeratorNoteTimestamp('sometime last week', now)).toBe(null);
  });
});
