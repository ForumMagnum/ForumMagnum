import type { LexicalNodeConfig } from 'lexical';
import { AgentBlockNode } from './AgentBlockNode';

/**
 * Lexical nodes the research workspace's editor must register. Spread these
 * into the host editor's nodes config:
 *
 *   const nodes = [...PlaygroundNodes, ...researchEditorNodes];
 *
 * `MarkNode` is included in the shared PlaygroundNodes used by LexicalEditor;
 * this bundle adds only the research-specific decorator nodes.
 */
export const researchEditorNodes: LexicalNodeConfig[] = [AgentBlockNode];
