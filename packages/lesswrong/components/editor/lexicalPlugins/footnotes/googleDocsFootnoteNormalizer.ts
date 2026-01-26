import { $generateNodesFromDOM } from "@lexical/html";
import { $getSelection, $isRangeSelection, LexicalEditor, PasteCommandType } from "lexical";
import { generateFootnoteId, FOOTNOTE_CLASSES, FOOTNOTE_ATTRIBUTES } from "./constants";
import { $reorderFootnotes } from "./helpers";

type GoogleDocsBacklinkInfo = {
  anchor: HTMLAnchorElement;
  footnoteId: string;
  index: number;
};

type GoogleDocsReferenceInfo = {
  anchor: HTMLAnchorElement;
  footnoteId: string;
  index: number;
};

function getGoogleDocsBacklinks(doc: Document): Map<number, GoogleDocsBacklinkInfo> {
  const backlinks = new Map<number, GoogleDocsBacklinkInfo>();
  const anchors = Array.from(doc.querySelectorAll('a[id^="ftnt"]')) as HTMLAnchorElement[];
  const idPattern = /^ftnt(\d+)$/;
  for (const anchor of anchors) {
    const match = anchor.id.match(idPattern);
    if (!match) {
      continue;
    }
    const index = Number.parseInt(match[1], 10);
    if (!Number.isFinite(index)) {
      continue;
    }
    backlinks.set(index, {
      anchor,
      footnoteId: generateFootnoteId(),
      index,
    });
  }
  return backlinks;
}

function getGoogleDocsReferences(
  doc: Document,
  backlinks: Map<number, GoogleDocsBacklinkInfo>
): GoogleDocsReferenceInfo[] {
  const references: GoogleDocsReferenceInfo[] = [];
  const anchors = Array.from(doc.querySelectorAll<HTMLAnchorElement>('a[id^="ftnt_ref"]'));
  const idPattern = /^ftnt_ref(\d+)$/;
  for (const anchor of anchors) {
    const match = anchor.id.match(idPattern);
    if (!match) {
      continue;
    }
    const index = Number.parseInt(match[1], 10);
    const backlink = backlinks.get(index);
    if (!backlink || !Number.isFinite(index)) {
      continue;
    }
    references.push({
      anchor,
      footnoteId: backlink.footnoteId,
      index,
    });
  }
  return references;
}

function replaceReferenceAnchorWithFootnoteSpan(
  doc: Document,
  reference: GoogleDocsReferenceInfo
): void {
  const span = doc.createElement('span');
  span.className = FOOTNOTE_CLASSES.footnoteReference;
  span.setAttribute(FOOTNOTE_ATTRIBUTES.footnoteReference, '');
  span.setAttribute(FOOTNOTE_ATTRIBUTES.footnoteId, reference.footnoteId);
  span.setAttribute(FOOTNOTE_ATTRIBUTES.footnoteIndex, String(reference.index));
  span.setAttribute('role', 'doc-noteref');
  span.id = `fnref${reference.footnoteId}`;
  span.textContent = `[${reference.index}]`;
  reference.anchor.replaceWith(span);
}

function getFootnoteContentContainer(anchor: HTMLAnchorElement): HTMLElement | null {
  return anchor.closest('li') ?? anchor.parentElement?.parentElement ?? null;
}

function cloneFootnoteContent(
  doc: Document,
  source: HTMLElement
): HTMLElement {
  const clone = source.cloneNode(true) as HTMLElement;
  const backlinks = Array.from(clone.querySelectorAll('a[id^="ftnt"]'));
  for (const backlink of backlinks) {
    const sup = backlink.closest('sup');
    if (sup) {
      sup.remove();
    } else {
      backlink.remove();
    }
  }
  const content = doc.createElement('div');
  content.className = FOOTNOTE_CLASSES.footnoteContent;
  content.setAttribute(FOOTNOTE_ATTRIBUTES.footnoteContent, '');
  while (clone.firstChild) {
    content.appendChild(clone.firstChild);
  }
  return content;
}

function buildFootnoteSectionFromGoogleDocs(
  doc: Document,
  backlinks: Map<number, GoogleDocsBacklinkInfo>
): { section: HTMLOListElement; containers: HTMLElement[] } {
  const section = doc.createElement('ol');
  section.className = `${FOOTNOTE_CLASSES.footnoteSection} ${FOOTNOTE_CLASSES.footnotes}`;
  section.setAttribute(FOOTNOTE_ATTRIBUTES.footnoteSection, '');
  section.setAttribute('role', 'doc-endnotes');

  const containers: HTMLElement[] = [];
  const orderedBacklinks = Array.from(backlinks.values()).sort((a, b) => a.index - b.index);
  for (const backlink of orderedBacklinks) {
    const item = doc.createElement('li');
    item.className = FOOTNOTE_CLASSES.footnoteItem;
    item.setAttribute(FOOTNOTE_ATTRIBUTES.footnoteItem, '');
    item.setAttribute(FOOTNOTE_ATTRIBUTES.footnoteId, backlink.footnoteId);
    item.setAttribute(FOOTNOTE_ATTRIBUTES.footnoteIndex, String(backlink.index));
    item.setAttribute('role', 'doc-endnote');
    item.id = `fn${backlink.footnoteId}`;

    const backLinkSpan = doc.createElement('span');
    backLinkSpan.className = FOOTNOTE_CLASSES.footnoteBackLink;
    backLinkSpan.setAttribute(FOOTNOTE_ATTRIBUTES.footnoteBackLink, '');
    backLinkSpan.setAttribute(FOOTNOTE_ATTRIBUTES.footnoteId, backlink.footnoteId);
    backLinkSpan.innerHTML = `<sup><strong><a href="#fnref${backlink.footnoteId}">^</a></strong></sup>`;

    const contentSource = getFootnoteContentContainer(backlink.anchor);
    if (contentSource) {
      containers.push(contentSource);
    }
    const content = contentSource
      ? cloneFootnoteContent(doc, contentSource)
      : doc.createElement('div');
    if (!content.hasAttribute(FOOTNOTE_ATTRIBUTES.footnoteContent)) {
      content.className = FOOTNOTE_CLASSES.footnoteContent;
      content.setAttribute(FOOTNOTE_ATTRIBUTES.footnoteContent, '');
    }

    item.append(backLinkSpan, content);
    section.append(item);
  }

  return { section, containers };
}

function normalizeGoogleDocsFootnotesHtml(html: string): Document | null {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const backlinks = getGoogleDocsBacklinks(doc);
  if (!backlinks.size) {
    return null;
  }
  const references = getGoogleDocsReferences(doc, backlinks);
  if (!references.length) {
    return null;
  }

  references.forEach((reference) => {
    replaceReferenceAnchorWithFootnoteSpan(doc, reference);
  });

  const { section, containers } = buildFootnoteSectionFromGoogleDocs(doc, backlinks);
  const firstContainer = containers[0];
  if (firstContainer?.previousElementSibling?.tagName.toLowerCase() === 'hr') {
    firstContainer.previousElementSibling.remove();
  }
  for (const container of new Set(containers)) {
    container.remove();
  }
  doc.body.append(section);

  return doc;
}

export function insertGoogleDocsFootnotesOnPaste(
  editor: LexicalEditor,
  event: PasteCommandType
): boolean {
  if (!('clipboardData' in event) || !event.clipboardData) {
    return false;
  }
  const html = event.clipboardData.getData('text/html');
  if (!html) {
    return false;
  }
  const normalizedDoc = normalizeGoogleDocsFootnotesHtml(html);
  if (!normalizedDoc) {
    return false;
  }
  event.preventDefault();
  event.stopPropagation();
  editor.update(() => {
    const selection = $getSelection();
    if (!$isRangeSelection(selection)) {
      return;
    }
    const nodes = $generateNodesFromDOM(editor, normalizedDoc);
    selection.insertNodes(nodes);
    $reorderFootnotes();
  });
  return true;
}
