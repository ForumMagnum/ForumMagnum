import { useCallback, useState } from 'react';
import { useMutation } from '@apollo/client/react';
import { $getNodeByKey, $getRoot, $nodesOfType, type LexicalEditor } from 'lexical';
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

/** The preview wraps the link, so the href comes from a child. */
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

/** The enclosing block, so the model sees how the phrase is used. */
function readSurroundingText(editor: LexicalEditor, targetNodeKey: string): string {
  if (!targetNodeKey) {
    return '';
  }
  return editor.getEditorState().read(() => {
    const target = $getNodeByKey(targetNodeKey);
    if (!target) {
      return '';
    }
    const block = target.getTopLevelElement();
    return block ? block.getTextContent() : $getRoot().getTextContent();
  });
}

/**
 * Fills in a preview, and a URL when the phrase has no link yet.
 * Checks the document for a reusable one before calling the model.
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
    // A phrase linked elsewhere already has a destination.
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
      // Only fills a gap; never replaces a link already on the phrase.
      return { html: suggestion.html, href: knownHref || suggestion.href };
    } catch (e) {
      setStatus('error');
      setError(e instanceof Error ? e.message : 'Generating the hover preview failed');
      return null;
    }
  }, [editor, generateHoverPreview]);

  return { status, error, suggest };
}
