import type { LexicalNodeConfig } from 'lexical';
import PlaygroundNodes from './PlaygroundNodes';
import { researchEditorNodes } from '@/components/research/lexical/researchEditorNodes';

/**
 * The universal Lexical node registry for headless editors. Includes every
 * custom node type the codebase defines across all collections (posts +
 * research documents). Used by headless editors that must parse Yjs / JSON
 * state which may contain any collection's nodes.
 *
 * Type-name collisions across collections are forbidden by convention — the
 * research nodes are namespaced with a `research-` prefix (`research-mention`,
 * `research-agent-block`, `research-query-input*`) so they coexist with the
 * post-side `mention` etc.
 *
 * Live editors keep their own per-UI registries — in particular,
 * `ChatComposer` passes `chatComposerNodes` (a strict subset that omits
 * `AgentBlockNode`) because the chat lacks the React context that node
 * requires to render. Don't replace those with this list.
 */
const allLexicalNodes: LexicalNodeConfig[] = [
  ...PlaygroundNodes,
  ...researchEditorNodes,
];

export default allLexicalNodes;
