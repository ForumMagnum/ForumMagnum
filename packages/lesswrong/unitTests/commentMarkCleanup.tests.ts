import { $createMarkNode, $isMarkNode } from '@lexical/mark';
import {
  $createTextNode,
  $getRoot,
  $isElementNode,
  type LexicalEditor,
  type LexicalNode,
  type NodeKey,
} from 'lexical';
import {
  $filterMarkNodeIds,
  $removeCommentMarkIds,
  getActiveCommentThreadIds,
} from '@/components/lexical/plugins/CommentPlugin/commentMarkCleanup';
import {
  createComment,
  createThread,
} from '@/components/lexical/commenting';
import {
  runEditorUpdate,
  setupEditorWithContent,
  walkLexicalNodes,
} from './lexicalTestHelpers';

interface MarkedEditor {
  editor: LexicalEditor;
  markNodeMap: Map<string, Set<NodeKey>>;
}

async function setupMarkedEditor(ids: string[]): Promise<MarkedEditor> {
  const editor = await setupEditorWithContent('Highlighted text');
  const markNodeMap = new Map<string, Set<NodeKey>>();

  await runEditorUpdate(editor, () => {
    const paragraph = $getRoot().getFirstChild();
    if (!$isElementNode(paragraph)) {
      throw new Error('Expected a paragraph');
    }

    paragraph.clear();
    const markNode = $createMarkNode(ids);
    markNode.append($createTextNode('Highlighted text'));
    paragraph.append(markNode);

    for (const id of ids) {
      markNodeMap.set(id, new Set([markNode.getKey()]));
    }
  });

  return { editor, markNodeMap };
}

function getAllMarkIds(editor: LexicalEditor): string[] {
  const ids: string[] = [];
  editor.getEditorState().read(() => {
    walkLexicalNodes($getRoot(), (node: LexicalNode) => {
      if ($isMarkNode(node)) {
        ids.push(...node.getIDs());
      }
    });
  });
  return ids;
}

function getMarkNodeCount(editor: LexicalEditor): number {
  let count = 0;
  editor.getEditorState().read(() => {
    walkLexicalNodes($getRoot(), (node: LexicalNode) => {
      if ($isMarkNode(node)) {
        count++;
      }
    });
  });
  return count;
}

describe('comment mark cleanup', () => {
  it('recognizes active comment and suggestion thread marks', () => {
    const commentThread = createThread(
      'Comment quote',
      [createComment('Comment', 'Author', 'author-id')],
      'comment-thread',
    );
    const suggestionThread = createThread(
      'Suggestion quote',
      [createComment('Suggestion', 'Agent', 'agent-id')],
      'suggestion-thread',
      { markID: 'suggestion-mark', threadType: 'suggestion' },
    );
    const topLevelComment = createComment(
      'Top-level comment',
      'Author',
      'author-id',
      'top-level-comment',
    );

    expect(
      getActiveCommentThreadIds(
        [
          'orphaned-mark',
          'comment-thread',
          'suggestion-mark',
          'top-level-comment',
        ],
        [commentThread, suggestionThread, topLevelComment],
      ),
    ).toEqual(['comment-thread', 'suggestion-mark']);
  });

  it('removes an orphaned ID while preserving a valid ID on the same mark', async () => {
    const { editor, markNodeMap } = await setupMarkedEditor([
      'valid-thread',
      'orphaned-thread',
    ]);

    await runEditorUpdate(editor, () => {
      $removeCommentMarkIds(markNodeMap, ['orphaned-thread']);
    });

    expect(getAllMarkIds(editor)).toEqual(['valid-thread']);
    expect(editor.getEditorState().read(() => $getRoot().getTextContent()))
      .toBe('Highlighted text');
  });

  it('only offers cleanup for MarkNodes', async () => {
    const { editor, markNodeMap } = await setupMarkedEditor([
      'orphaned-thread',
    ]);

    await runEditorUpdate(editor, () => {
      const textNode = $getRoot().getFirstDescendant();
      if (!textNode) {
        throw new Error('Expected marked text');
      }
      markNodeMap.set('orphaned-suggestion', new Set([textNode.getKey()]));

      expect(
        $filterMarkNodeIds(
          markNodeMap,
          ['orphaned-thread', 'orphaned-suggestion'],
        ),
      ).toEqual(['orphaned-thread']);
    });
  });

  it('unwraps a mark after removing its only orphaned ID', async () => {
    const { editor, markNodeMap } = await setupMarkedEditor([
      'orphaned-thread',
    ]);

    await runEditorUpdate(editor, () => {
      $removeCommentMarkIds(markNodeMap, ['orphaned-thread']);
    });

    expect(getAllMarkIds(editor)).toEqual([]);
    expect(getMarkNodeCount(editor)).toBe(0);
    expect(editor.getEditorState().read(() => $getRoot().getTextContent()))
      .toBe('Highlighted text');
  });
});
