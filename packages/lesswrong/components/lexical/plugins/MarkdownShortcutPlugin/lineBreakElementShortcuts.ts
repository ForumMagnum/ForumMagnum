import type { ElementTransformer, Transformer } from '@lexical/markdown';
import {
  $addUpdateTag,
  $createParagraphNode,
  $getSelection,
  $isLineBreakNode,
  $isParagraphNode,
  $isRangeSelection,
  $isRootOrShadowRoot,
  $isTextNode,
  COLLABORATION_TAG,
  EditorState,
  HISTORIC_TAG,
  HISTORY_PUSH_TAG,
  LexicalEditor,
  LineBreakNode,
  ParagraphNode,
  TextNode,
} from 'lexical';

interface ElementTransformerMatch {
  transformer: ElementTransformer,
  match: RegExpMatchArray,
}

interface TypedTextPosition {
  anchorNode: TextNode,
  anchorOffset: number,
}

function isElementTransformer(transformer: Transformer): transformer is ElementTransformer {
  return transformer.type === 'element';
}

function findElementTransformerMatch(
  textContent: string,
  anchorOffset: number,
  transformers: ElementTransformer[],
): ElementTransformerMatch | null {
  if (textContent[anchorOffset - 1] !== ' ') {
    return null;
  }
  for (const transformer of transformers) {
    const match = textContent.match(transformer.regExp);
    const expectedMatchLength = match?.[0].endsWith(' ') ? anchorOffset : anchorOffset - 1;
    if (match && match[0].length === expectedMatchLength) {
      return { transformer, match };
    }
  }
  return null;
}

function $splitParagraphAtLineBreak(paragraph: ParagraphNode, lineBreak: LineBreakNode): ParagraphNode {
  const newParagraph = $createParagraphNode();
  newParagraph.append(...lineBreak.getNextSiblings());
  lineBreak.remove();
  paragraph.insertAfter(newParagraph);
  return newParagraph;
}

function getTypedTextNodeAfterLineBreak(
  editorState: EditorState,
  prevEditorState: EditorState,
  dirtyLeaves: Set<string>,
): TypedTextPosition | null {
  const selection = editorState.read($getSelection);
  const prevSelection = prevEditorState.read($getSelection);
  if (!$isRangeSelection(prevSelection) || !$isRangeSelection(selection) || !selection.isCollapsed() || selection.is(prevSelection)) {
    return null;
  }
  const anchorKey = selection.anchor.key;
  const anchorOffset = selection.anchor.offset;
  const anchorNode = editorState._nodeMap.get(anchorKey);
  const typedOneCharacter = anchorOffset === 1 || anchorOffset <= prevSelection.anchor.offset + 1;
  if (!$isTextNode(anchorNode) || !dirtyLeaves.has(anchorKey) || !typedOneCharacter) {
    return null;
  }
  return { anchorNode, anchorOffset };
}

function $runElementTransformerAfterLineBreak(
  anchorNode: TextNode,
  anchorOffset: number,
  transformers: ElementTransformer[],
): boolean {
  if (!anchorNode.isAttached() || anchorNode.hasFormat('code')) {
    return false;
  }
  const lineBreak = anchorNode.getPreviousSibling();
  const paragraph = anchorNode.getParent();
  if (!$isLineBreakNode(lineBreak) || !$isParagraphNode(paragraph) || !$isRootOrShadowRoot(paragraph.getParent())) {
    return false;
  }
  const transformerMatch = findElementTransformerMatch(anchorNode.getTextContent(), anchorOffset, transformers);
  if (!transformerMatch) {
    return false;
  }

  const newParagraph = $splitParagraphAtLineBreak(paragraph, lineBreak);
  const nextSiblings = anchorNode.getNextSiblings();
  const [leadingNode, remainderNode] = anchorNode.splitText(anchorOffset);
  const children = remainderNode ? [remainderNode, ...nextSiblings] : nextSiblings;
  leadingNode.remove();
  transformerMatch.transformer.replace(newParagraph, children, transformerMatch.match, false);
  return true;
}

/**
 * Lexical's markdown shortcuts only recognize block-level shortcuts (like `> `
 * or `# `) at the very start of a paragraph. After a soft line break
 * (Shift+Enter), the new line looks like a new paragraph but is the same one,
 * so typing a shortcut there did nothing. This splits the paragraph at the
 * line break and applies the shortcut to the new line.
 */
export function registerLineBreakElementShortcuts(editor: LexicalEditor, transformers: Transformer[]): () => void {
  const elementTransformers = transformers.filter(isElementTransformer);
  return editor.registerUpdateListener(({ tags, dirtyLeaves, editorState, prevEditorState }) => {
    if (tags.has(COLLABORATION_TAG) || tags.has(HISTORIC_TAG) || editor.isComposing()) {
      return;
    }
    const typed = getTypedTextNodeAfterLineBreak(editorState, prevEditorState, dirtyLeaves);
    if (!typed) {
      return;
    }
    editor.update(() => {
      if ($runElementTransformerAfterLineBreak(typed.anchorNode, typed.anchorOffset, elementTransformers)) {
        $addUpdateTag(HISTORY_PUSH_TAG);
      }
    });
  });
}
