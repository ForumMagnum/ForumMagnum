export type MentionKind = 'doc' | 'conv';

export interface MentionProps {
  kind: MentionKind;
  id: string;
  title: string;
}

export const MENTION_DOM_CLASS = 'research-mention';

export function formatMentionToken({ kind, id, title }: MentionProps): string {
  const escapedTitle = title
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/[\r\n]+/g, ' ');
  return `@[${kind}:${id} "${escapedTitle}"]`;
}

export function isMentionKind(value: string | null | undefined): value is MentionKind {
  return value === 'doc' || value === 'conv';
}

const MENTION_TOKEN_BODY = /^@\[(doc|conv):([A-Za-z0-9_-]+)[ \t]+"((?:[^"\\]|\\.)*)"\]/;
const MENTION_TOKEN_GLOBAL = /@\[(doc|conv):([A-Za-z0-9_-]+)[ \t]+"((?:[^"\\]|\\.)*)"\]/g;

export interface MentionTokenMatch extends MentionProps {
  raw: string;
  index: number;
}

export function tryParseMentionAt(text: string, pos: number): MentionTokenMatch | null {
  const tail = pos === 0 ? text : text.slice(pos);
  const match = tail.match(MENTION_TOKEN_BODY);
  if (!match) return null;
  return {
    kind: match[1] as MentionKind,
    id: match[2],
    title: unescapeMentionTitle(match[3]),
    raw: match[0],
    index: pos,
  };
}

export function extractMentionTokens(text: string): MentionTokenMatch[] {
  const out: MentionTokenMatch[] = [];
  for (const m of text.matchAll(MENTION_TOKEN_GLOBAL)) {
    if (m.index === undefined) continue;
    out.push({
      kind: m[1] as MentionKind,
      id: m[2],
      title: unescapeMentionTitle(m[3]),
      raw: m[0],
      index: m.index,
    });
  }
  return out;
}

export function rewriteMentionTokens(
  text: string,
  rewrite: (match: MentionTokenMatch) => MentionProps,
): string {
  return text.replace(MENTION_TOKEN_GLOBAL, (raw, kind, id, escapedTitle, index: number) => {
    const next = rewrite({
      kind: kind as MentionKind,
      id,
      title: unescapeMentionTitle(escapedTitle),
      raw,
      index,
    });
    return formatMentionToken(next);
  });
}

function unescapeMentionTitle(escaped: string): string {
  return escaped.replace(/\\(.)/g, '$1');
}
