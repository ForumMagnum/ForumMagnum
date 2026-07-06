'use client';

import { useContext, useEffect, useRef } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $createParagraphNode,
  $createRangeSelection,
  $getNodeByKey,
  $getRoot,
  $getSelection,
  $isElementNode,
  $isParagraphNode,
  $isRangeSelection,
  $isRootNode,
  $isTextNode,
  COMMAND_PRIORITY_CRITICAL,
  COMMAND_PRIORITY_HIGH,
  COMMAND_PRIORITY_LOW,
  KEY_BACKSPACE_COMMAND,
  KEY_DOWN_COMMAND,
  KEY_ENTER_COMMAND,
  createCommand,
  type LexicalCommand,
  type LexicalEditor,
  type LexicalNode,
} from 'lexical';
import { $generateHtmlFromNodes, $generateNodesFromDOM } from '@lexical/html';
import { $findMatchingParent, mergeRegister } from '@lexical/utils';
import { randomId } from '@/lib/random';
import { $createPopulatedResearchConversationNode, $isResearchConversationNode } from './ResearchConversationNode';
import {
  $createPopulatedQueryInputNode,
  $isQueryInputNode,
  DEFAULT_BLANK_RUNTIME,
  QueryInputNode,
  type QueryInputSelection,
} from './QueryInputNode';
import {
  $createQueryInputHeaderNode,
  $isQueryInputHeaderNode,
  QueryInputHeaderNode,
} from './QueryInputHeaderNode';
import {
  $createQueryInputContentNode,
  $isQueryInputContentNode,
  QueryInputContentNode,
} from './QueryInputContentNode';
import { useResearchEditorEnvironment, type ResearchEditorEnvironment } from './ResearchEditorContext';
import { isSandboxWarmingError } from '../sandboxWarming';
import { useMessages } from '@/components/common/withMessages';
import { type WithMessagesFunctions } from '@/components/layout/FlashMessages';
import { EditorUserModeContext } from '@/components/common/sharedContexts';
import { EditorUserMode } from '@/components/editor/lexicalPlugins/suggestions/EditorUserMode';

// Query inputs are structural blocks that fire agent conversations and get
// replaced by AgentBlocks; none of that can be represented as a tracked
// suggestion, so creation, submission, and removal are all blocked in
// suggesting mode (see the suggestion-mode section of
// `components/editor/CLAUDE.md`).
const QUERY_INPUT_SUGGESTION_MODE_MESSAGE = 'Query blocks are not supported in suggesting mode';

export const QUERY_COMMAND_PREFIX = '/query ';
const QUERY_BARE = '/query';

export const INSERT_QUERY_INPUT_COMMAND: LexicalCommand<void> = createCommand(
  'INSERT_QUERY_INPUT_COMMAND',
);

const EMPTY_QUERY_INPUT_SELECTION: QueryInputSelection = { baseEnvironmentId: null, runtime: null };

function $insertQueryInputAtSelection(): void {
  const { node, content } = $createPopulatedQueryInputNode(EMPTY_QUERY_INPUT_SELECTION);

  const selection = $getSelection();
  if ($isRangeSelection(selection)) {
    const block = selection.anchor.getNode().getTopLevelElement();
    if (block) block.replace(node);
    else $getRoot().append(node);
  } else {
    $getRoot().append(node);
  }
  content.getFirstChild()?.selectStart();
}

function $ensureQueryInputStructure(node: QueryInputNode): void {
  const children = node.getChildren();
  let header: QueryInputHeaderNode | null = null;
  let content: QueryInputContentNode | null = null;
  const strayChildren: LexicalNode[] = [];

  for (const child of children) {
    if ($isQueryInputHeaderNode(child)) {
      if (header === null) header = child;
      else child.remove();
    } else if ($isQueryInputContentNode(child)) {
      if (content === null) content = child;
      else {
        for (const grandchild of child.getChildren()) content.append(grandchild);
        child.remove();
      }
    } else {
      strayChildren.push(child);
    }
  }

  if (header === null) header = $createQueryInputHeaderNode();
  if (content === null) content = $createQueryInputContentNode();
  if (content.getChildrenSize() === 0) content.append($createParagraphNode());

  for (const stray of strayChildren) content.append(stray);

  if (node.getFirstChild() !== header) {
    const firstChild = node.getFirstChild();
    if (firstChild) firstChild.insertBefore(header);
    else node.append(header);
  }
  if (header.getNextSibling() !== content) {
    header.insertAfter(content);
  }
}

function $dissolveQueryInput(queryInput: QueryInputNode): void {
  const replacement = $createParagraphNode();
  queryInput.replace(replacement);
  replacement.selectStart();
}

interface FireQueryArgs {
  editor: LexicalEditor;
  env: ResearchEditorEnvironment;
  conversationId: string;
  agentBlockKey: string;
  promptHtml: string;
  selection: QueryInputSelection;
  flash: WithMessagesFunctions['flash'];
}

async function fireQuery({
  editor,
  env,
  conversationId,
  agentBlockKey,
  promptHtml,
  selection,
  flash,
}: FireQueryArgs): Promise<void> {
  try {
    await env.fireDocumentQuery({
      conversationId,
      documentId: env.documentId,
      promptHtml,
      baseEnvironmentId: selection.baseEnvironmentId,
      runtime: selection.runtime,
    });
    // The AgentBlock is already in the doc with the correct conversationId,
    // so a successful mutation needs no further client-side action.
  } catch (err) {
    if (isSandboxWarmingError(err)) {
      flash({ messageString: 'The sandbox is still starting up — try again in a moment.' });
    } else {
      // eslint-disable-next-line no-console
      console.error('[research] /query failed to fire', err);
      flash({ messageString: 'Failed to send query — try again.', type: 'error' });
    }
    editor.update(() => {
      const agentBlock = $getNodeByKey(agentBlockKey);
      if (!$isResearchConversationNode(agentBlock)) return;
      const restored = $restoreQueryInputFromHtml(editor, promptHtml, selection);
      agentBlock.replace(restored.node);
      const last = restored.content.getLastDescendant();
      if (last) last.selectEnd();
      else restored.content.selectEnd();
    });
  }
}

function $restoreQueryInputFromHtml(
  editor: LexicalEditor,
  promptHtml: string,
  selection: QueryInputSelection,
): { node: QueryInputNode; content: QueryInputContentNode } {
  const dom = new DOMParser().parseFromString(promptHtml, 'text/html');
  const parsed = $generateNodesFromDOM(editor, dom);
  // The parsed top-level may itself be a QueryInputContentNode (since the
  // submit-time HTML wraps content in that class) — unwrap so we don't
  // double-nest. Anything else gets folded in as content children.
  const contentChildren: LexicalNode[] = [];
  for (const n of parsed) {
    if ($isQueryInputContentNode(n)) contentChildren.push(...n.getChildren());
    else contentChildren.push(n);
  }
  return $createPopulatedQueryInputNode(selection, contentChildren);
}

function $isTopLevelParagraphWithText(
  textNode: LexicalNode | null,
  expectedText: string,
): boolean {
  if (!$isTextNode(textNode)) return false;
  const parent = textNode.getParent();
  if (!parent || !$isParagraphNode(parent)) return false;
  if (parent.getChildrenSize() !== 1) return false;
  if (!$isRootNode(parent.getParent())) return false;
  return parent.getTextContent() === expectedText;
}

export function QueryInputPlugin() {
  const [editor] = useLexicalComposerContext();
  const env = useResearchEditorEnvironment();
  const { flash } = useMessages();
  const externalModeContext = useContext(EditorUserModeContext);
  // Read through a ref inside the long-lived handlers below so a mode toggle
  // doesn't tear down and re-register them all (re-registering the node
  // transform would also mark every QueryInputNode dirty and force a
  // reconciliation pass).
  const isSuggestionModeRef = useRef(false);
  isSuggestionModeRef.current = externalModeContext?.userMode === EditorUserMode.Suggest;

  useEffect(() => {
    if (!editor.hasNodes([QueryInputNode, QueryInputContentNode])) {
      throw new Error('QueryInputPlugin: QueryInputNode / QueryInputContentNode not registered on editor');
    }

    return mergeRegister(
      // External insertion (slash menu, programmatic).
      editor.registerCommand(
        INSERT_QUERY_INPUT_COMMAND,
        () => {
          if (isSuggestionModeRef.current) {
            flash({ messageString: QUERY_INPUT_SUGGESTION_MODE_MESSAGE, type: 'error' });
            return true;
          }
          editor.update(() => $insertQueryInputAtSelection());
          return true;
        },
        COMMAND_PRIORITY_LOW,
      ),

      // Autoformat on `/query<space>` at a top-level paragraph.
      editor.registerUpdateListener(({ dirtyLeaves, tags, editorState }) => {
        if (tags.has('collaboration')) return;
        if (dirtyLeaves.size === 0) return;
        let hasMatch = false;
        editorState.read(() => {
          for (const key of dirtyLeaves) {
            if ($isTopLevelParagraphWithText($getNodeByKey(key), QUERY_COMMAND_PREFIX)) {
              hasMatch = true;
              return;
            }
          }
        });
        if (!hasMatch) return;
        if (isSuggestionModeRef.current) {
          flash({ messageString: QUERY_INPUT_SUGGESTION_MODE_MESSAGE, type: 'error' });
          return;
        }
        editor.update(() => {
          $insertQueryInputAtSelection();
        });
      }),

      // Submit on Cmd/Ctrl+Enter inside a QueryInput. Runs at KEY_DOWN with
      // CRITICAL priority because SubmitOnCmdEnterPlugin (mounted in the base
      // Editor) intercepts Cmd+Enter at KEY_DOWN+HIGH and stops propagation,
      // which would otherwise prevent KEY_ENTER_COMMAND from ever firing.
      editor.registerCommand(
        KEY_DOWN_COMMAND,
        (event) => {
          if (event.key !== 'Enter' || !(event.metaKey || event.ctrlKey)) return false;
          if (event.isComposing) return false;

          const selection = $getSelection();
          if (!$isRangeSelection(selection) || !selection.isCollapsed()) return false;

          const queryInput = $findMatchingParent(selection.anchor.getNode(), $isQueryInputNode);
          if (!queryInput) return false;

          if (isSuggestionModeRef.current) {
            flash({ messageString: 'Queries cannot be run in suggesting mode', type: 'error' });
            event.preventDefault();
            return true;
          }

          if (!queryInput.getTextContent().trim()) {
            event.preventDefault();
            return true;
          }

          const contentNode = queryInput.getChildren().find($isQueryInputContentNode);
          if (!contentNode) return false;

          const contentSelection = $createRangeSelection();
          contentSelection.anchor.set(contentNode.getKey(), 0, 'element');
          contentSelection.focus.set(contentNode.getKey(), contentNode.getChildrenSize(), 'element');
          const promptHtml = $generateHtmlFromNodes(editor, contentSelection);
          // Default to a blank baseline if neither field is set (e.g. a submit
          // before the header finished hydrating), so we never send "neither"
          // and trip the backend's exactly-one check.
          const rawSelection = queryInput.getSelection();
          const querySelection: QueryInputSelection =
            rawSelection.baseEnvironmentId || rawSelection.runtime
              ? rawSelection
              : { baseEnvironmentId: null, runtime: DEFAULT_BLANK_RUNTIME };

          // Generate the conversation id client-side so the doc binds to the
          // conversation BEFORE the mutation returns: a refresh mid-flight
          // finds the AgentBlock and the server-side row sharing the same id,
          // and the events stream wires up on reload.
          const conversationId = randomId();
          // v2 conversation block: transcript + an in-document (Yjs) reply
          // composer, replacing the query input in the doc.
          const { node: agentBlock } = $createPopulatedResearchConversationNode(conversationId);
          const agentBlockKey = agentBlock.getKey();

          // Trailing paragraph so the cursor has somewhere to land after the
          // block (its transcript is a decorator; the composer is shadow-rooted).
          const trailing = $createParagraphNode();
          queryInput.insertAfter(trailing);
          queryInput.replace(agentBlock);
          trailing.selectStart();

          event.preventDefault();
          queueMicrotask(() => {
            void fireQuery({ editor, env, conversationId, agentBlockKey, promptHtml, selection: querySelection, flash });
          });
          return true;
        },
        COMMAND_PRIORITY_CRITICAL,
      ),

      // Insert on plain Enter at the end of a bare `/query` paragraph.
      editor.registerCommand(
        KEY_ENTER_COMMAND,
        (event) => {
          const selection = $getSelection();
          if (!$isRangeSelection(selection) || !selection.isCollapsed()) return false;
          if (event && (event.metaKey || event.ctrlKey)) return false;

          const block = selection.anchor.getNode().getTopLevelElement();
          if (!block || !$isParagraphNode(block)) return false;
          if (!$isRootNode(block.getParent())) return false;
          if (block.getTextContent() !== QUERY_BARE) return false;

          if (isSuggestionModeRef.current) {
            flash({ messageString: QUERY_INPUT_SUGGESTION_MODE_MESSAGE, type: 'error' });
            event?.preventDefault();
            return true;
          }

          editor.update(() => {
            $insertQueryInputAtSelection();
          });
          event?.preventDefault();
          return true;
        },
        COMMAND_PRIORITY_HIGH,
      ),

      // Backspace at the start of an empty content area → dissolve the
      // QueryInput back to a plain paragraph.
      editor.registerCommand(
        KEY_BACKSPACE_COMMAND,
        (event) => {
          const selection = $getSelection();
          if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
            return false;
          }
          if (selection.anchor.offset !== 0) return false;

          const anchorNode = selection.anchor.getNode();
          const queryInput = $findMatchingParent(anchorNode, $isQueryInputNode);
          if (!queryInput) return false;

          const content = queryInput.getChildren().find($isQueryInputContentNode);
          if (!content) return false;
          if (content.getChildrenSize() !== 1) return false;
          const only = content.getFirstChild();
          if (!$isElementNode(only)) return false;
          if (only.getTextContentSize() !== 0) return false;

          if (isSuggestionModeRef.current) {
            flash({ messageString: QUERY_INPUT_SUGGESTION_MODE_MESSAGE, type: 'error' });
            event.preventDefault();
            return true;
          }

          event.preventDefault();
          $dissolveQueryInput(queryInput);
          return true;
        },
        COMMAND_PRIORITY_LOW,
      ),

      // Normalize a QueryInputNode's children to [Header, Content].
      editor.registerNodeTransform(QueryInputNode, $ensureQueryInputStructure),
    );
  }, [editor, env, flash]);

  return null;
}
