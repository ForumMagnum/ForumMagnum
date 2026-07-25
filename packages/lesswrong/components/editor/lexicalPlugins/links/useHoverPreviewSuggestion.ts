import { useCallback, useState } from 'react';
import { useMutation } from '@apollo/client/react';
import { $getRoot, $nodesOfType, type LexicalEditor } from 'lexical';
import { $generateHtmlFromNodes } from '@lexical/html';
import { gql } from '@/lib/generated/gql-codegen';
import { HoverPreviewNode } from './HoverPreviewNode';
import { $isLinkNode } from '@lexical/link';
import {
  findHrefForPhrase,
  findTwinPreview,
  type HoverPreviewEntry,
} from './hoverPreviewReuse';

const GenerateHoverPreviewMutation = gql(`
  mutation generateHoverPreview($documentHtml: String!, $phrase: String!, $surroundingText: String, $href: String) {
    generateHoverPreview(documentHtml: $documentHtml, phrase: $phrase, surroundingText: $surroundingText, href: $href) {
      html
      href
    }
  }
`);

export type HoverPreviewSuggestionStatus = 'idle' | 'pending' | 'error';

export interface HoverPreviewSuggestion {
  html: string;
  href: string;
}

/**
 * Every hover preview already in the document, as candidate sources for reuse. The preview
 * wraps the link rather than sitting inside it, so the href comes from a child.
 */
function collectHoverPreviewEntries(editor: LexicalEditor): HoverPreviewEntry[] {
  return editor.getEditorState().read(() => (
    $nodesOfType(HoverPreviewNode).map(node => {
      const link = node.getChildren().find($isLinkNode);
      return {
        text: node.getTextContent(),
        previewHtml: node.getPreviewHtml(),
        href: link ? link.getURL() : '',
        nodeKey: node.getKey(),
      };
    })
  ));
}

function readDocumentHtml(editor: LexicalEditor): string {
  return editor.getEditorState().read(() => $generateHtmlFromNodes(editor, null));
}

/**
 * The block the link sits in, so the model can see how the phrase is being used rather than
 * having to locate it in the whole document.
 */
function readSurroundingText(editor: LexicalEditor, targetNodeKey: string): string {
  if (!targetNodeKey) {
    return '';
  }
  return editor.getEditorState().read(() => {
    const target = $nodesOfType(HoverPreviewNode).find(node => node.getKey() === targetNodeKey);
    if (!target) {
      return '';
    }
    const block = target.getTopLevelElement();
    return block ? block.getTextContent() : $getRoot().getTextContent();
  });
}

/**
 * Fills in a link's hover preview (and, when it has no link yet, its URL).
 *
 * Checks the rest of the document first: the same phrase or the same destination explained
 * twice deserves one explanation, and copying is both cheaper and more consistent than asking
 * a model to write a near-duplicate.
 */
export function useHoverPreviewSuggestion(editor: LexicalEditor | null) {
  const [status, setStatus] = useState<HoverPreviewSuggestionStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [generateHoverPreview] = useMutation(GenerateHoverPreviewMutation);

  const suggest = useCallback(async ({ targetNodeKey, phrase, href }: {
    targetNodeKey: string,
    phrase: string,
    href: string,
  }): Promise<HoverPreviewSuggestion | null> => {
    if (!editor || !phrase.trim()) {
      return null;
    }
    setStatus('pending');
    setError(null);

    const entries = collectHoverPreviewEntries(editor);
    // An unlinked phrase the document links elsewhere already has its destination.
    const knownHref = href.trim() || findHrefForPhrase(entries, targetNodeKey, phrase);

    const twin = findTwinPreview(entries, targetNodeKey, phrase, knownHref);
    if (twin) {
      setStatus('idle');
      return { html: twin.previewHtml, href: knownHref || twin.href };
    }

    try {
      const result = await generateHoverPreview({
        variables: {
          documentHtml: readDocumentHtml(editor),
          phrase,
          surroundingText: readSurroundingText(editor, targetNodeKey),
          href: knownHref,
        },
      });
      const suggestion = result.data?.generateHoverPreview;
      if (!suggestion) {
        throw new Error('No hover preview was returned');
      }
      setStatus('idle');
      // Only ever fills a gap: a link the author already chose is never replaced.
      return { html: suggestion.html, href: href.trim() ? href.trim() : (suggestion.href || knownHref) };
    } catch (e) {
      setStatus('error');
      setError(e instanceof Error ? e.message : 'Generating the hover preview failed');
      return null;
    }
  }, [editor, generateHoverPreview]);

  return { status, error, suggest };
}
