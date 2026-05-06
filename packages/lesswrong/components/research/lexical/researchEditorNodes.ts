import type { LexicalNodeConfig } from 'lexical';
import { MarkNode } from '@lexical/mark';
import { AgentBlockNode } from './AgentBlockNode';

/**
 * Lexical nodes the research workspace's editor must register. Spread these
 * into the host editor's nodes config:
 *
 *   const nodes = [...PlaygroundNodes, ...researchEditorNodes];
 *
 * `MarkNode` is included in PlaygroundNodes already; we still list it here so
 * a research-only editor (no PlaygroundNodes) can stand alone.
 */
export const researchEditorNodes: LexicalNodeConfig[] = [MarkNode, AgentBlockNode];
