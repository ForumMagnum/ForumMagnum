interface LinkRange {
  start: number
  end: number
}

const INLINE_LINK_REGEX = /\[[^\]]+]\(\s*<?[^)\s>]+[^)]*\)/g;
const REFERENCE_LINK_REGEX = /\[[^\]]+]\s*\[[^\]]*]/g;
const AUTOLINK_REGEX = /<https?:\/\/[^>]+>/g;

const collectLinkRanges = (markdown: string): LinkRange[] => {
  const ranges: LinkRange[] = [];
  const addMatches = (regex: RegExp) => {
    regex.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(markdown)) !== null) {
      ranges.push({ start: match.index, end: match.index + match[0].length });
    }
  };

  addMatches(INLINE_LINK_REGEX);
  addMatches(REFERENCE_LINK_REGEX);
  addMatches(AUTOLINK_REGEX);

  return ranges.sort((a, b) => a.start - b.start);
};

const findLinkRangeContainingIndex = (ranges: LinkRange[], index: number): LinkRange | null => {
  for (const range of ranges) {
    if (index > range.start && index < range.end) {
      return range;
    }
  }
  return null;
};

const paragraphBreaks = (markdown: string): number[] => {
  const breaks: number[] = [];
  const regex = /\n\s*\n+/g;
  regex.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(markdown)) !== null) {
    breaks.push(match.index);
  }
  return breaks;
};

export const truncateMarkdown = (markdown: string, targetLength: number): string => {
  if (markdown.length <= targetLength) {
    return markdown;
  }

  const slop = Math.max(80, Math.round(targetLength * 0.2));
  const minLength = Math.max(0, targetLength - slop);
  const maxLength = Math.min(markdown.length, targetLength + slop);
  const breaks = paragraphBreaks(markdown);

  let cutoff = -1;
  for (let i = breaks.length - 1; i >= 0; i -= 1) {
    const index = breaks[i];
    if (index <= maxLength && index >= minLength) {
      cutoff = index;
      break;
    }
  }

  if (cutoff === -1) {
    for (let i = breaks.length - 1; i >= 0; i -= 1) {
      const index = breaks[i];
      if (index <= maxLength) {
        cutoff = index;
        break;
      }
    }
  }

  if (cutoff === -1) {
    cutoff = maxLength;
  }

  const linkRanges = collectLinkRanges(markdown);
  let safeCutoff = cutoff;
  let range = findLinkRangeContainingIndex(linkRanges, safeCutoff);
  while (range) {
    safeCutoff = range.start;
    range = findLinkRangeContainingIndex(linkRanges, safeCutoff);
  }

  if (safeCutoff <= 0) {
    return "";
  }

  return markdown.slice(0, safeCutoff).trimEnd();
};
