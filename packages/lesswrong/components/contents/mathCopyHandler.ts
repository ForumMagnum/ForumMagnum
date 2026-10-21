/**
 * Server-rendered LaTeX (see renderMathInHtml) is CHTML, which draws its
 * glyphs with CSS, so the browser's default copy produces garbage for it in
 * the text/plain clipboard format. Each rendered equation carries its TeX
 * source in an aria-label, so on copy we substitute that source, wrapped in
 * delimiters, into the plaintext. The text/html format keeps the rendered
 * equations, since our editor recovers the TeX source from them on paste.
 */

const mathContainerSelector = 'mjx-container[aria-label]';

function getEnclosingMathContainer(node: Node): Element|null {
  const element = node instanceof Element ? node : node.parentElement;
  return element?.closest(mathContainerSelector) ?? null;
}

/**
 * Clone the range, widened so that equations which are only partially
 * selected are selected in their entirety.
 */
function expandRangeToWholeEquations(range: Range): Range {
  const expanded = range.cloneRange();
  const startContainer = getEnclosingMathContainer(range.startContainer);
  if (startContainer) {
    expanded.setStartBefore(startContainer);
  }
  const endContainer = getEnclosingMathContainer(range.endContainer);
  if (endContainer) {
    expanded.setEndAfter(endContainer);
  }
  return expanded;
}

function wrapTexSource(tex: string, isDisplay: boolean): string {
  return isDisplay ? `$$${tex}$$` : `\\(${tex}\\)`;
}

/**
 * Replace each rendered equation in `root` with its delimited TeX source. Display
 * equations become divs so they stay on their own line in innerText, and line
 * breaks within the TeX source are preserved.
 */
function replaceMathWithTexSource(root: ParentNode, ownerDocument: Document) {
  for (const container of Array.from(root.querySelectorAll(mathContainerSelector))) {
    const isDisplay = container.getAttribute('display') === 'true';
    const replacement = ownerDocument.createElement(isDisplay ? 'div' : 'span');
    replacement.style.whiteSpace = 'pre-wrap';
    replacement.textContent = wrapTexSource(container.getAttribute('aria-label') ?? '', isDisplay);
    container.replaceWith(replacement);
  }
}

function removeStyleElements(root: ParentNode) {
  for (const style of Array.from(root.querySelectorAll('style'))) {
    style.remove();
  }
}

/**
 * Convert the copied fragment to plaintext. innerText only reflects layout
 * (eg newlines between paragraphs) for elements that are being rendered, so
 * the fragment is briefly attached to the document, out of view.
 */
function fragmentToPlaintext(fragment: DocumentFragment, ownerDocument: Document): string {
  const offscreen = ownerDocument.createElement('div');
  offscreen.style.position = 'fixed';
  offscreen.style.left = '-100000px';
  offscreen.style.top = '0';
  offscreen.appendChild(fragment);
  ownerDocument.body.appendChild(offscreen);
  try {
    return offscreen.innerText;
  } finally {
    offscreen.remove();
  }
}

function fragmentToHtml(fragment: DocumentFragment, ownerDocument: Document): string {
  const wrapper = ownerDocument.createElement('div');
  wrapper.appendChild(fragment);
  return wrapper.innerHTML;
}

/** The parts of a ClipboardEvent that handleMathCopy uses */
interface MathCopyEvent {
  defaultPrevented: boolean,
  currentTarget: EventTarget|null,
  clipboardData: Pick<DataTransfer, 'setData'>|null,
  preventDefault: () => void,
}

export function handleMathCopy(event: MathCopyEvent) {
  if (event.defaultPrevented || !event.clipboardData) {
    return;
  }
  const ownerDocument = event.currentTarget instanceof Node ? event.currentTarget.ownerDocument : null;
  const selection = ownerDocument?.getSelection();
  if (!ownerDocument || !selection || selection.isCollapsed || selection.rangeCount === 0) {
    return;
  }

  const ranges: Range[] = [];
  for (let i = 0; i < selection.rangeCount; i++) {
    ranges.push(expandRangeToWholeEquations(selection.getRangeAt(i)));
  }

  const htmlFragments = ranges.map(range => range.cloneContents());
  if (!htmlFragments.some(fragment => fragment.querySelector(mathContainerSelector))) {
    return;
  }
  const textFragments = ranges.map(range => range.cloneContents());

  const plaintext = textFragments.map(fragment => {
    removeStyleElements(fragment);
    replaceMathWithTexSource(fragment, ownerDocument);
    return fragmentToPlaintext(fragment, ownerDocument);
  }).join('\n');
  const html = htmlFragments.map(fragment => {
    removeStyleElements(fragment);
    return fragmentToHtml(fragment, ownerDocument);
  }).join('');

  event.clipboardData.setData('text/plain', plaintext);
  event.clipboardData.setData('text/html', html);
  event.preventDefault();
}
