import { parseDocumentFromString } from '@/lib/domParser';

// Bold often holds a multi-sentence summary, so keep the whole run.
function extractLeadingText(element: Element): string {
  const firstChild = element.firstElementChild;
  if (firstChild && (firstChild.tagName === 'STRONG' || firstChild.tagName === 'B')) {
    return (firstChild.textContent ?? '').trim();
  }
  const plainText = (element.textContent ?? '').replace(/\s+/g, ' ').trim();
  return plainText.match(/^[^.!?]*[.!?]/)?.[0]?.trim() ?? plainText;
}

export function extractRejectionReasonSummary(html: string): string[] {
  const { document } = parseDocumentFromString(html);
  const body = document.body;
  const firstSignificantElement = Array.from(body.children).find(
    child => child.tagName !== 'P' || (child.textContent ?? '').trim()
  );
  if (!firstSignificantElement) return [];
  if (firstSignificantElement.tagName === 'UL' || firstSignificantElement.tagName === 'OL') {
    return Array.from(firstSignificantElement.querySelectorAll('li')).map(li => extractLeadingText(li)).filter(Boolean);
  }
  const target = firstSignificantElement.tagName === 'P' ? firstSignificantElement : body;
  const leading = extractLeadingText(target);
  return leading ? [leading] : [];
}
