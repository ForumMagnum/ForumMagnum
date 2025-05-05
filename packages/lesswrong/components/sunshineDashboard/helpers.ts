// The following function was created using OpenAI Codex CLI with o3
// It's probably more complicated than it needs to be, but it works.

// Highlight the given HTML by wrapping every sentence that has an LLM score in a
// span whose background colour is determined by that score. Higher scores are shown
// in a stronger red, lower scores in green. Hovering over a sentence will reveal the
// score via the browser’s native `title` tooltip.
export function highlightHtmlWithLlmDetectionScores(
  html: string,
  sentenceScores: { sentence: string; score: number }[]
) {
  if (!html || sentenceScores.length === 0) return html;

  // Filter first; if no sentences remain, return html unmodified.
  // Only consider sentences that have a non-trivial length *and* a non-zero
  // score (the design calls for leaving score-0 sentences uncoloured).
  const meaningfulSentences = sentenceScores.filter(
    (s) =>
      s.score > 0 &&
      s.sentence &&
      s.sentence.trim().length >= 3
  );
  if (meaningfulSentences.length === 0) return html;

  // Parse the HTML into a detached DOM tree.
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div class="root">${html}</div>`, 'text/html');

  // Colour helper (score 0 → green, 1 → red).
  const scores = meaningfulSentences.map((s) => s.score);
  const minScore = Math.min(...scores);
  const maxScore = Math.max(...scores);
  const scoreRange = maxScore - minScore || 1;
  const scoreToColour = (score: number) => {
    const ratio = (score - minScore) / scoreRange;
    const hue = 120 - (ratio * 120);
    return `hsl(${hue}, 100%, 85%)`;
  };

  // Normalization util: strip basic markdown syntax and collapse spaces.
  const normalize = (str: string) =>
    str
      .replace(/^\s*[>*+-]\s+/, '') // bullets & blockquotes
      .replace(/^\s*#+\s+/, '') // heading #'s
      .replace(/^\s*\d+\.\s+/, '') // numbered list "1. "
      .replace(/[*_`~]/g, '') // emphasis markers
      .replace(/\s+/g, ' ')
      .trim();

  const processedSet = new Set<string>();
  const root = doc.body.firstElementChild as HTMLElement;

  // --- Pass 1: highlight whole-elements that match the sentence text exactly ---
  meaningfulSentences.forEach(({ sentence, score }) => {
    const target = normalize(sentence);
    if (!target) return;

    const treeWalker = doc.createTreeWalker(root, NodeFilter.SHOW_ELEMENT, {
      acceptNode(node) {
        // Only consider elements that contain some text content.  We no longer
        // insist that an element be a leaf node, because sentences may span
        // multiple inline elements such as <strong>…</strong> or <em>…</em>.
        // By allowing non-leaf nodes we can match list items like:
        //   <li><strong>Title</strong>: rest of sentence</li>
        // which previously failed to highlight.
        return node.textContent?.trim()
          ? NodeFilter.FILTER_ACCEPT
          : NodeFilter.FILTER_SKIP;
      },
    });

    let el: Node | null = treeWalker.nextNode();
    while (el) {
      const elText = normalize(el.textContent || '');
      if (elText === target) {
        (el as HTMLElement).style.backgroundColor = scoreToColour(score);
        (el as HTMLElement).title = `Score: ${score.toFixed(2)}`;
        (el as HTMLElement).classList.add('llm-highlight');
        processedSet.add(sentence);
        break;
      }
      el = treeWalker.nextNode();
    }
  });

  // --- Pass 2: fallback to substring search within remaining text nodes ---
  const remaining = meaningfulSentences.filter((s) => !processedSet.has(s.sentence));
  if (remaining.length === 0) return root.innerHTML;

  // Build map sentence → span template
  const sentenceToSpan = new Map<string, HTMLElement>();
  remaining.forEach(({ sentence, score }) => {
    const span = doc.createElement('span');
    span.className = 'llm-highlight';
    span.style.backgroundColor = scoreToColour(score);
    span.title = `Score: ${score.toFixed(2)}`;
    sentenceToSpan.set(sentence, span);
  });

  // Helper to process text nodes recursively.
  const processTextNode = (node: Text) => {
    const txt = node.textContent || '';
    if (!txt.trim()) return;

    for (const [sentence, spanTemplate] of sentenceToSpan) {
      const idx = txt.indexOf(sentence);
      if (idx !== -1) {
        const before = txt.slice(0, idx);
        const match = txt.slice(idx, idx + sentence.length);
        const after = txt.slice(idx + sentence.length);

        if (before) node.parentNode!.insertBefore(doc.createTextNode(before), node);

        const span = spanTemplate.cloneNode() as HTMLElement;
        span.textContent = match;
        node.parentNode!.insertBefore(span, node);

        if (after) {
          const afterNode = doc.createTextNode(after);
          node.parentNode!.insertBefore(afterNode, node);
          processTextNode(afterNode);
        }

        node.parentNode!.removeChild(node);
        sentenceToSpan.delete(sentence);
        return;
      }
    }
  };

  // Collect and process all text nodes.
  const walker = doc.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
  let text: Text | null = walker.nextNode() as Text | null;
  const nodes: Text[] = [];
  while (text) {
    nodes.push(text);
    text = walker.nextNode() as Text | null;
  }
  nodes.forEach(processTextNode);

  return root.innerHTML;
}
