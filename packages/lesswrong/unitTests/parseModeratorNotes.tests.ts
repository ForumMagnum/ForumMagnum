import moment from 'moment-timezone';
import { parseModeratorNotes } from '@/components/sunshineDashboard/supermod/parseModeratorNotes';

const pacific = (str: string) => moment.tz(str, 'YYYY-MM-DD h:mm A', 'America/Los_Angeles').toDate();
const now = pacific('2025-08-20 12:00 PM');

describe('parseModeratorNotes', () => {
  it('returns no entries for empty notes', () => {
    expect(parseModeratorNotes('', now)).toEqual([]);
    expect(parseModeratorNotes(null, now)).toEqual([]);
  });

  it('parses a signed entry', () => {
    expect(parseModeratorNotes('Aug 15, 3:42 PM, Raemon: snoozed\n', now)).toEqual([
      { timestamp: 'Aug 15, 3:42 PM', date: pacific('2025-08-15 3:42 PM'), author: 'Raemon', body: 'snoozed' },
    ]);
  });

  it('parses multiple entries, newest first', () => {
    const notes = 'Aug 15, 3:42 PM, Raemon: snoozed\nAug 14, 1:00 PM, habryka: reviewed\n';
    expect(parseModeratorNotes(notes, now)).toEqual([
      { timestamp: 'Aug 15, 3:42 PM', date: pacific('2025-08-15 3:42 PM'), author: 'Raemon', body: 'snoozed' },
      { timestamp: 'Aug 14, 1:00 PM', date: pacific('2025-08-14 1:00 PM'), author: 'habryka', body: 'reviewed' },
    ]);
  });

  it('keeps continuation lines with their entry', () => {
    const notes = 'Aug 15, 3:42 PM, Raemon: first line\nsecond line\n\nAug 14, 1:00 PM, habryka: older';
    expect(parseModeratorNotes(notes, now)).toEqual([
      { timestamp: 'Aug 15, 3:42 PM', date: pacific('2025-08-15 3:42 PM'), author: 'Raemon', body: 'first line\nsecond line' },
      { timestamp: 'Aug 14, 1:00 PM', date: pacific('2025-08-14 1:00 PM'), author: 'habryka', body: 'older' },
    ]);
  });

  it('handles unsigned leading text', () => {
    const notes = 'some old unsigned note\nAug 14, 1:00 PM, habryka: signed';
    expect(parseModeratorNotes(notes, now)).toEqual([
      { timestamp: null, date: null, author: null, body: 'some old unsigned note' },
      { timestamp: 'Aug 14, 1:00 PM', date: pacific('2025-08-14 1:00 PM'), author: 'habryka', body: 'signed' },
    ]);
  });

  it('handles legacy signature formats', () => {
    expect(parseModeratorNotes('10/25/2019, Ruby: old style', now)).toEqual([
      { timestamp: '10/25/2019', date: pacific('2019-10-25 12:00 AM'), author: 'Ruby', body: 'old style' },
    ]);
    expect(parseModeratorNotes('Aug 15, 2024, Raemon: with a year', now)).toEqual([
      { timestamp: 'Aug 15, 2024', date: pacific('2024-08-15 12:00 AM'), author: 'Raemon', body: 'with a year' },
    ]);
  });

  it('assumes last year when a yearless date would otherwise be in the future', () => {
    expect(parseModeratorNotes('Dec 3, 1:00 PM, Raemon: older note', now)).toEqual([
      { timestamp: 'Dec 3, 1:00 PM', date: pacific('2024-12-03 1:00 PM'), author: 'Raemon', body: 'older note' },
    ]);
  });

  it('reads yearless dates as older than the entry above them', () => {
    const notes = 'Jan 5, 1:00 PM, Raemon: newer\nDec 3, 1:00 PM, habryka: older';
    expect(parseModeratorNotes(notes, now)).toEqual([
      { timestamp: 'Jan 5, 1:00 PM', date: pacific('2025-01-05 1:00 PM'), author: 'Raemon', body: 'newer' },
      { timestamp: 'Dec 3, 1:00 PM', date: pacific('2024-12-03 1:00 PM'), author: 'habryka', body: 'older' },
    ]);
  });

  it('strips the extra indentation automod notes carry after the colon', () => {
    expect(parseModeratorNotes('Aug 13, 2:13 AM, Arjun Rao:  "Unreviewed post"', now)).toEqual([
      { timestamp: 'Aug 13, 2:13 AM', date: pacific('2025-08-13 2:13 AM'), author: 'Arjun Rao', body: '"Unreviewed post"' },
    ]);
  });

  it('does not treat a colon in prose as a signature', () => {
    expect(parseModeratorNotes('Aug 15, 3:42 PM, Raemon: note\nsee this: a thing', now)).toEqual([
      { timestamp: 'Aug 15, 3:42 PM', date: pacific('2025-08-15 3:42 PM'), author: 'Raemon', body: 'note\nsee this: a thing' },
    ]);
  });

  it('returns a null date for unrecognized timestamps', () => {
    expect(parseModeratorNotes('sometime last week, Raemon: vague', now)).toEqual([
      { timestamp: null, date: null, author: null, body: 'sometime last week, Raemon: vague' },
    ]);
  });
});
