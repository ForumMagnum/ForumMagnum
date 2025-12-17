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

/**
 * Extract words from text, keeping only alphanumeric sequences.
 * Returns lowercase words for case-insensitive matching.
 */
function extractWords(text: string): string[] {
  // Split on any non-alphanumeric characters, filter empty strings
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(w => w.length > 0);
}

interface WordWithPosition {
  word: string;
  charPos: number; // Character position in original text
  wordIndex: number; // Index in the word array
}

/**
 * Extract words with their character positions from text.
 */
function extractWordsWithPositions(text: string): WordWithPosition[] {
  const result: WordWithPosition[] = [];
  const regex = /[a-zA-Z0-9]+/g;
  let match;
  let wordIndex = 0;
  
  while ((match = regex.exec(text)) !== null) {
    result.push({
      word: match[0].toLowerCase(),
      charPos: match.index,
      wordIndex: wordIndex++,
    });
  }
  
  return result;
}

/**
 * Find where a sequence of target words appears IN ORDER within the HTML words.
 * Returns the character position of the first matched word, or null if not found.
 * 
 * This allows gaps (skipped HTML words) but requires the target words to appear
 * in the correct sequence. We require matching at least `minMatches` of the
 * target words.
 */
function findSequenceInOrder(
  htmlWords: WordWithPosition[],
  targetWords: string[],
  startFromWordIndex: number,
  minMatches: number,
  maxGap: number = 50 // Max HTML words to skip between matches
): { charPos: number; wordIndex: number; matchCount: number } | null {
  if (targetWords.length === 0) return null;
  
  let bestMatch: { charPos: number; wordIndex: number; matchCount: number } | null = null;
  
  // Try starting from each occurrence of the first target word
  for (let i = startFromWordIndex; i < htmlWords.length; i++) {
    if (htmlWords[i].word !== targetWords[0]) continue;
    
    // Found potential start - try to match the rest in sequence
    let htmlIdx = i;
    let targetIdx = 0;
    let matchCount = 0;
    let lastMatchHtmlIdx = i;
    
    while (htmlIdx < htmlWords.length && targetIdx < targetWords.length) {
      // Check if we've gone too far without a match
      if (htmlIdx - lastMatchHtmlIdx > maxGap) break;
      
      if (htmlWords[htmlIdx].word === targetWords[targetIdx]) {
        matchCount++;
        lastMatchHtmlIdx = htmlIdx;
        targetIdx++;
      }
      htmlIdx++;
    }
    
    // Check if this is a good enough match
    if (matchCount >= minMatches) {
      if (!bestMatch || matchCount > bestMatch.matchCount) {
        bestMatch = {
          charPos: htmlWords[i].charPos,
          wordIndex: i,
          matchCount,
        };
      }
      // If we found a really good match, use it immediately
      if (matchCount >= targetWords.length * 0.8) {
        return bestMatch;
      }
    }
  }
  
  return bestMatch;
}

/**
 * Find where a sequence ends - scans forward from startWordIndex looking for
 * the target words in order, returns the position after the last matched word.
 */
function findSequenceEnd(
  htmlWords: WordWithPosition[],
  targetWords: string[],
  startFromWordIndex: number,
  minMatches: number,
  maxGap: number = 50
): { charPos: number; wordIndex: number; matchCount: number } | null {
  if (targetWords.length === 0) return null;
  
  // Scan forward looking for where the target sequence appears
  let htmlIdx = startFromWordIndex;
  let targetIdx = 0;
  let matchCount = 0;
  let lastMatchHtmlIdx = startFromWordIndex;
  let lastMatchCharPos = htmlWords[startFromWordIndex]?.charPos ?? 0;
  
  while (htmlIdx < htmlWords.length && targetIdx < targetWords.length) {
    // Check if we've gone too far without a match
    if (matchCount > 0 && htmlIdx - lastMatchHtmlIdx > maxGap) {
      // We've lost the sequence - this is where it ended
      break;
    }
    
    if (htmlWords[htmlIdx].word === targetWords[targetIdx]) {
      matchCount++;
      lastMatchHtmlIdx = htmlIdx;
      lastMatchCharPos = htmlWords[htmlIdx].charPos + htmlWords[htmlIdx].word.length;
      targetIdx++;
    }
    htmlIdx++;
  }
  
  if (matchCount >= minMatches) {
    return {
      charPos: lastMatchCharPos,
      wordIndex: lastMatchHtmlIdx,
      matchCount,
    };
  }
  
  return null;
}

interface TextNodeInfo {
  node: Text;
  element: HTMLElement;
  startPos: number;
  endPos: number;
}

/**
 * Build the full text content from the HTML, inserting spaces between text nodes
 * to prevent word merging (e.g., "<h2>Abstract</h2><p>This" becoming "AbstractThis").
 * Also returns a list of text nodes with their positions for later highlighting.
 */
function buildTextContentWithSpaces(root: HTMLElement, doc: Document): { text: string; textNodes: TextNodeInfo[] } {
  const textNodes: TextNodeInfo[] = [];
  const walker = doc.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
  let pos = 0;
  let textParts: string[] = [];
  let node: Text | null = walker.nextNode() as Text | null;
  
  while (node) {
    const text = node.textContent || '';
    if (text.length > 0) {
      // Add a space before this text node if we already have content and the
      // previous character isn't already whitespace
      if (pos > 0 && textParts.length > 0) {
        const lastPart = textParts[textParts.length - 1];
        const lastChar = lastPart[lastPart.length - 1];
        const firstChar = text[0];
        // Add space if neither the end of previous nor start of current is whitespace
        if (!/\s/.test(lastChar) && !/\s/.test(firstChar)) {
          textParts.push(' ');
          pos += 1;
        }
      }
      
      textNodes.push({
        node,
        element: node.parentElement!,
        startPos: pos,
        endPos: pos + text.length,
      });
      textParts.push(text);
      pos += text.length;
    }
    node = walker.nextNode() as Text | null;
  }
  
  return { text: textParts.join(''), textNodes };
}

/**
 * Find which elements contain text in the given character range.
 */
function findElementsInRange(
  textNodes: TextNodeInfo[],
  startPos: number,
  endPos: number
): Set<HTMLElement> {
  const elements = new Set<HTMLElement>();
  const blockTags = ['p', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'div', 'td', 'th', 'section'];
  
  for (const nodeInfo of textNodes) {
    // Check if this node overlaps with our range
    if (nodeInfo.endPos <= startPos || nodeInfo.startPos >= endPos) continue;
    
    // Find the nearest block-level ancestor
    let el: HTMLElement | null = nodeInfo.element;
    while (el) {
      const tagName = el.tagName?.toLowerCase();
      if (blockTags.includes(tagName)) {
        elements.add(el);
        break;
      }
      el = el.parentElement;
    }
  }
  
  return elements;
}

/**
 * Highlight HTML content using Pangram's window-based scores.
 * 
 * Uses a simple word-based matching algorithm:
 * 1. Extract words from both the window text and HTML text
 * 2. Find where the first N words of each window appear in the HTML
 * 3. Scan forward to find where the last N words appear
 * 4. Highlight all elements in between
 */
export function highlightHtmlWithPangramWindowScores(
  html: string,
  windowScores: { text: string; score: number; startIndex: number; endIndex: number }[]
) {
  const DEBUG = true;
  // eslint-disable-next-line no-console
  const log = DEBUG ? console.log.bind(console, '[PangramHighlight]') : () => {};
  
  log('=== Starting highlighting ===');
  log('HTML length:', html.length);
  log('Window count:', windowScores.length);
  
  if (!html || windowScores.length === 0) {
    log('Early return: no HTML or no windows');
    return html;
  }

  // Filter to meaningful windows with non-trivial scores
  const meaningfulWindows = windowScores.filter(
    (w) => w.score > 0 && w.text && w.text.trim().length >= 3
  );
  log('Meaningful windows (score > 0):', meaningfulWindows.length);
  
  if (meaningfulWindows.length === 0) return html;

  // Parse the HTML into a detached DOM tree
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div class="root">${html}</div>`, 'text/html');
  const root = doc.body.firstElementChild as HTMLElement;
  
  // Build the text content with spaces between text nodes (prevents "AbstractThis" merging)
  const { text: htmlText, textNodes } = buildTextContentWithSpaces(root, doc);
  log('HTML text length:', htmlText.length);
  log('HTML text preview (first 200 chars):', htmlText.slice(0, 200));
  
  // Extract words with positions for sequential matching
  const htmlWords = extractWordsWithPositions(htmlText);
  log('HTML word count:', htmlWords.length);
  log('Text nodes:', textNodes.length);

  // Colour helper (score 0 → green, 1 → red)
  const scores = meaningfulWindows.map((w) => w.score);
  const minScore = Math.min(...scores);
  const maxScore = Math.max(...scores);
  const scoreRange = maxScore - minScore || 1;
  const scoreToColour = (score: number) => {
    const ratio = (score - minScore) / scoreRange;
    const hue = 120 - (ratio * 120);
    return `hsl(${hue}, 100%, 85%)`;
  };

  // Track where we are in the HTML to process windows in order
  // BUT allow some overlap since Pangram windows often overlap
  let lastStartWordIndex = 0;

  // Words that are likely to be missing from HTML (list numbers rendered by CSS, etc.)
  // or are too common to be useful for matching
  const skipWords = new Set(['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12',
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'is', 'are',
    'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
    'would', 'could', 'should', 'may', 'might', 'must', 'shall', 'can', 'this', 'that',
    'these', 'those', 'it', 'its', 'with', 'as', 'by', 'from']);
  
  /**
   * Filter anchor words to remove ones that are likely to cause matching issues
   */
  const filterAnchorWords = (words: string[]): string[] => {
    return words.filter(w => !skipWords.has(w) && w.length > 2);
  };

  // Process each window
  for (let i = 0; i < meaningfulWindows.length; i++) {
    const window = meaningfulWindows[i];
    log(`\n--- Window ${i} ---`);
    log('Score:', window.score);
    log('Window text length:', window.text.length);
    log('Window text preview (first 150 chars):', window.text.slice(0, 150));
    
    // Extract words from the window
    const windowWords = extractWords(window.text);
    log('Window word count:', windowWords.length);
    log('First 15 words:', windowWords.slice(0, 15));
    log('Last 15 words:', windowWords.slice(-15));
    
    if (windowWords.length < 5) {
      log('Skipping: too few words');
      continue;
    }
    
    // Use more anchor words, then filter out unhelpful ones
    const RAW_ANCHOR_COUNT = 20;
    const startAnchorWords = filterAnchorWords(windowWords.slice(0, RAW_ANCHOR_COUNT));
    const endAnchorWords = filterAnchorWords(windowWords.slice(-RAW_ANCHOR_COUNT));
    
    log('Start anchor words (filtered):', startAnchorWords);
    log('End anchor words (filtered):', endAnchorWords);
    
    if (startAnchorWords.length < 3) {
      log('Skipping: not enough meaningful start anchor words');
      continue;
    }
    
    // Find start: look for the start anchor words appearing IN ORDER in the HTML
    // Allow searching a bit before lastStartWordIndex since windows can overlap
    const searchFromWordIndex = Math.max(0, lastStartWordIndex - 20);
    const minStartMatches = Math.max(3, Math.floor(startAnchorWords.length * 0.35));
    const startMatch = findSequenceInOrder(
      htmlWords,
      startAnchorWords,
      searchFromWordIndex,
      minStartMatches,
      40 // Max gap between matched words (increased for formatting)
    );
    
    if (!startMatch) {
      log(`Skipping: could not find start sequence (need ${minStartMatches}/${startAnchorWords.length} in order)`);
      continue;
    }
    
    log(`Found start at char ${startMatch.charPos}, word index ${startMatch.wordIndex}, matched ${startMatch.matchCount}/${startAnchorWords.length}`);
    
    // Find end: scan forward from partway through the window
    // Estimate based on window word count
    const estimatedWindowWordCount = windowWords.length;
    const scanFromWordIndex = startMatch.wordIndex + Math.max(10, Math.floor(estimatedWindowWordCount * 0.5));
    
    const minEndMatches = Math.max(3, Math.floor(endAnchorWords.length * 0.35));
    const endMatch = findSequenceEnd(
      htmlWords,
      endAnchorWords,
      scanFromWordIndex,
      minEndMatches,
      40 // Max gap between matched words
    );
    
    let startPos = startMatch.charPos;
    let endPos: number;
    
    if (endMatch) {
      endPos = endMatch.charPos;
      log(`Found end at char ${endPos}, word index ${endMatch.wordIndex}, matched ${endMatch.matchCount}/${endAnchorWords.length}`);
    } else {
      // Fallback: estimate end based on window word count
      const fallbackEndWordIndex = Math.min(startMatch.wordIndex + estimatedWindowWordCount, htmlWords.length - 1);
      endPos = htmlWords[fallbackEndWordIndex]?.charPos ?? htmlText.length;
      log(`Using fallback end position: ${endPos} (estimated from word count)`);
    }
    
    // Update tracking - use START position so overlapping windows can still be found
    lastStartWordIndex = startMatch.wordIndex;
    
    // Ensure end is after start
    if (endPos <= startPos) {
      endPos = startPos + 200;
      log(`Adjusted end position (was <= start): ${endPos}`);
    }
    
    log('Final range:', startPos, '-', endPos, '(length:', endPos - startPos, ')');
    log('Text in range preview:', htmlText.slice(startPos, Math.min(startPos + 150, endPos)));
    
    // Find elements that overlap with this range
    const elementsToHighlight = findElementsInRange(textNodes, startPos, endPos);
    log('Elements to highlight:', elementsToHighlight.size);
    
    // Highlight the elements
    for (const element of elementsToHighlight) {
      if (!element.classList.contains('pangram-highlight')) {
        element.style.backgroundColor = scoreToColour(window.score);
        element.title = `Pangram Score: ${window.score.toFixed(2)}`;
        element.classList.add('pangram-highlight');
        log('Highlighted element:', element.tagName, '- text preview:', (element.textContent || '').slice(0, 50));
      }
    }
  }
  
  log('\n=== Highlighting complete ===');
  
  return root.innerHTML;
}
