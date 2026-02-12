interface LinkRange {
  start: number
  end: number
}

const AUTOLINK_REGEX = /<https?:\/\/[^>]+>/g;

const isEscaped = (markdown: string, index: number): boolean => {
  let slashCount = 0;
  for (let i = index - 1; i >= 0 && markdown[i] === "\\"; i -= 1) {
    slashCount += 1;
  }
  return slashCount % 2 === 1;
};

const findMatchingBracket = (
  markdown: string,
  startIndex: number,
  opening: string,
  closing: string
): number => {
  let depth = 0;
  for (let i = startIndex; i < markdown.length; i += 1) {
    const ch = markdown[i];
    if (isEscaped(markdown, i)) {
      continue;
    }
    if (ch === opening) {
      depth += 1;
    } else if (ch === closing) {
      depth -= 1;
      if (depth === 0) {
        return i;
      }
    }
  }
  return -1;
};

const parseInlineLinkEnd = (markdown: string, openParenIndex: number): number => {
  let depth = 1;
  for (let i = openParenIndex + 1; i < markdown.length; i += 1) {
    const ch = markdown[i];
    if (isEscaped(markdown, i)) {
      continue;
    }
    if (ch === "(") {
      depth += 1;
    } else if (ch === ")") {
      depth -= 1;
      if (depth === 0) {
        return i + 1;
      }
    }
  }
  return -1;
};

const collectInlineAndReferenceLinkRanges = (markdown: string): LinkRange[] => {
  const ranges: LinkRange[] = [];

  for (let i = 0; i < markdown.length; i += 1) {
    if (markdown[i] !== "[" || isEscaped(markdown, i)) {
      continue;
    }

    const linkTextEnd = findMatchingBracket(markdown, i, "[", "]");
    if (linkTextEnd === -1) {
      continue;
    }

    const linkStart = i > 0 && markdown[i - 1] === "!" ? i - 1 : i;
    let j = linkTextEnd + 1;
    while (j < markdown.length && /\s/.test(markdown[j])) {
      j += 1;
    }

    if (markdown[j] === "(") {
      const inlineEnd = parseInlineLinkEnd(markdown, j);
      if (inlineEnd !== -1) {
        ranges.push({ start: linkStart, end: inlineEnd });
      }
      continue;
    }

    if (markdown[j] === "[") {
      const referenceEnd = findMatchingBracket(markdown, j, "[", "]");
      if (referenceEnd !== -1) {
        ranges.push({ start: linkStart, end: referenceEnd + 1 });
      }
    }
  }

  return ranges;
};

const collectLinkRanges = (markdown: string): LinkRange[] => {
  const ranges: LinkRange[] = [];
  ranges.push(...collectInlineAndReferenceLinkRanges(markdown));

  AUTOLINK_REGEX.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = AUTOLINK_REGEX.exec(markdown)) !== null) {
    ranges.push({ start: match.index, end: match.index + match[0].length });
  }

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
