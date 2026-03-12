import { createEditor, $nodesOfType } from 'lexical';
import type { LexicalEditor } from 'lexical';
import { $generateHtmlFromNodes } from '@lexical/html';
import PlaygroundNodes from '@/components/lexical/nodes/PlaygroundNodes';
import PlaygroundEditorTheme from '@/components/lexical/themes/PlaygroundEditorTheme';
import { ProtonNode, $isSuggestionNode } from './ProtonNode';
import { $rejectAllSuggestions } from './rejectAllSuggestions';

/**
 * Creates a headless clone of the editor state, rejects all suggestions in
 * the clone, and returns the resulting HTML. Returns undefined if there are
 * no suggestion nodes present.
 *
 * This is the Lexical equivalent of CKEditor's TrackChangesData plugin's
 * `getDataWithDiscardedSuggestions` method. The returned HTML represents what
 * the document looks like with all unaccepted suggestions removed/reverted,
 * which is used as the reader-visible content on save.
 */
export function getDataWithDiscardedSuggestions(editor: LexicalEditor): string | undefined {
  let hasSuggestions = false;
  editor.getEditorState().read(() => {
    hasSuggestions = $nodesOfType(ProtonNode).some($isSuggestionNode);
  });

  if (!hasSuggestions) {
    return undefined;
  }

  // Create a headless editor with the same node registrations as the live
  // editor. We don't need a root element since we only parse, mutate, and
  // serialize the state.
  const headlessEditor = createEditor({
    namespace: 'SuggestionRejection',
    nodes: [...PlaygroundNodes],
    theme: PlaygroundEditorTheme,
    onError: (error) => {
      // eslint-disable-next-line no-console
      console.error('[getDataWithDiscardedSuggestions]', error);
    },
  });

  const stateJSON = JSON.stringify(editor.getEditorState().toJSON());
  const clonedState = headlessEditor.parseEditorState(stateJSON);
  headlessEditor.setEditorState(clonedState);

  headlessEditor.update(
    () => {
      $rejectAllSuggestions();
    },
    { discrete: true },
  );

  let html = '';
  headlessEditor.getEditorState().read(() => {
    html = $generateHtmlFromNodes(headlessEditor, null);
  });

  return html;
}
